import admin from "firebase-admin";
import * as fs from "fs";
import pl from "nodejs-polars";
import { Command } from "commander";
import csvParser from "csv-parser";
import * as readline from "readline";
import * as path from "path";
import { getFirestore } from "firebase-admin/firestore";

// =============================================================================
// CSV COLUMN MAPPING CONFIGURATION
// =============================================================================

interface CsvColumnMapping {
  recordNumber: string;
  category: string;
  productName: string;
  productId: string;
  productCode: string;
  sku: string;
  shadeName: string;
  shadeCode: string;
  hexCode: string;
  price: string;
  stock: string;
  quantity: string;
  tagline: string;
  shortDescription: string;
  description: string;
  keyBenefits: string;
  ingredients: string;
  howToUse: string;
  caution: string;
  shippingAndDelivery: string;
  productLink: string;
}

const CSV_COLUMNS: CsvColumnMapping = {
  recordNumber: "No",
  category: "Category",
  productName: "Product name",
  productId: "Product ID",
  productCode: "Product code",
  sku: "SKU",
  shadeName: "Shade name",
  shadeCode: "Shade code",
  hexCode: "Hex code",
  price: "Price (₹)",
  stock: "Stock",
  quantity: "Quantity",
  tagline: "Tagline",
  shortDescription: "Short description",
  description: "Description",
  keyBenefits: "Key benefits",
  ingredients: "Ingredients",
  howToUse: "How to Use",
  caution: "Caution",
  shippingAndDelivery: "Shipping and Delivery",
  productLink: "Product link",
};

// =============================================================================
// VARIANT IDENTIFICATION CONFIGURATION
// =============================================================================

interface VariantIdentifiers {
  primary: keyof CsvColumnMapping;
  secondary: Array<keyof CsvColumnMapping>;
  variantSpecific: Array<keyof CsvColumnMapping>;
}

const VARIANT_IDENTIFIERS: VariantIdentifiers = {
  primary: "productCode",
  secondary: ["shadeName", "shadeCode", "hexCode"],
  variantSpecific: ["price", "stock", "quantity", "productLink"],
};

const VARIANT_SORT_BY = "shadeName";

// =============================================================================
// GROUPING CONFIGURATION
// =============================================================================

interface GroupingConfig {
  groupByField: keyof CsvColumnMapping;
  strategy: "groupByValue" | "emptyFieldIndicatesVariant";
  emptyFieldIndicator?: keyof CsvColumnMapping;
}

const GROUPING_CONFIG: GroupingConfig = {
  groupByField: "productId",
  strategy: "groupByValue",
};

const FIELD_SEPARATORS = {
  keyBenefits: "\n",
  ingredients: ",",
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

interface ParsedSize {
  raw: string;
  value: number | null;
  unit: string | null;
}

interface Shade {
  name: string;
  code: string;
  hexCode: string;
  slug?: string; // slugified shade name for asset matching
}

interface ProductVariant {
  sku: string;
  productCode?: string;
  price: { amount: number; currency: string };
  inventory: { quantity: number; available: boolean; stock?: string };
  shade?: Shade;
  size?: ParsedSize;
  productLink?: string;
  images: string[];
}

interface ProductData {
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  variants: ProductVariant[];
  tagline: string;
  keyBenefits: string[];
  ingredients: string[];
  howToUse: string;
  caution: string;
  shippingAndDelivery: string;
  productLink: string;
  heroImage: string;
  status: string;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

const ALLOWED_PRODUCT_FIELDS: Array<keyof ProductData> = [
  "name",
  "description",
  "shortDescription",
  "category",
  "variants",
  "tagline",
  "keyBenefits",
  "ingredients",
  "howToUse",
  "caution",
  "shippingAndDelivery",
  "productLink",
  "heroImage",
  "status",
];

const ALLOWED_VARIANT_FIELDS: Array<keyof ProductVariant> = [
  "sku",
  "productCode",
  "price",
  "inventory",
  "shade",
  "size",
  "productLink",
  "images",
];

// =============================================================================
// PURE HELPER FUNCTIONS
// =============================================================================

const sortVariants = (variants: ProductVariant[]): ProductVariant[] => {
  return [...variants].sort((a, b) => {
    if (VARIANT_SORT_BY === "shadeName") {
      return (a.shade?.name || "").localeCompare(b.shade?.name || "");
    } else if (VARIANT_SORT_BY === "shadeCode") {
      return (a.shade?.code || "").localeCompare(b.shade?.code || "");
    } else if (VARIANT_SORT_BY === "sku") {
      return (a.sku || "").localeCompare(b.sku || "");
    } else if (VARIANT_SORT_BY === "price") {
      return a.price.amount - b.price.amount;
    }
    return 0;
  });
};

const slugifySegment = (name?: string): string => {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const TOP_LEVEL_CATEGORIES = new Set(["eyes", "face", "hairs", "lips"]);
const CATEGORY_SYNONYMS: Record<string, string> = {
  hair: "hairs",
  lip: "lips",
};

const normalizeTopCategory = (raw?: string): string | undefined => {
  const slug = slugifySegment(raw);
  if (!slug) return undefined;
  const mapped = CATEGORY_SYNONYMS[slug] || slug;
  return TOP_LEVEL_CATEGORIES.has(mapped) ? mapped : undefined;
};

// Removed unused hex color helper to satisfy lint rules

const parseSize = (raw: any): ParsedSize | undefined => {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  const match = s.match(/([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)/);
  if (!match) return { raw: s, value: null, unit: null };
  const value = parseFloat(match[1]);
  const unit = match[2] || null;
  return { raw: s, value: isNaN(value) ? null : value, unit };
};

const parsePriceToCents = (priceRaw: any): number => {
  if (priceRaw === undefined || priceRaw === null) return 0;
  const s = String(priceRaw).trim().replace(/[ ,₹]/g, "");
  const n = parseFloat(s || "0");
  if (Number.isNaN(n) || !isFinite(n)) return 0;
  return Math.round(n * 100);
};

const parseQuantity = (qtyRaw: any): number => {
  if (qtyRaw === undefined || qtyRaw === null) return 0;
  const s = String(qtyRaw).trim().replace(/,/g, "");
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
};

const askQuestion = (question: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const getColumnValue = (row: any, columnName: string): string => {
  return String(row[columnName] || "").trim();
};

const buildMissingGroupKey = (row: Record<string, string>, index: number): string => {
  const category = getColumnValue(row, CSV_COLUMNS.category);
  const productName = getColumnValue(row, CSV_COLUMNS.productName);
  const productCode = getColumnValue(row, CSV_COLUMNS.productCode);
  const recordNumber = getColumnValue(row, CSV_COLUMNS.recordNumber);
  const key = [category, productName, productCode, recordNumber].filter(Boolean).join("|");
  return key ? `missing:${key}` : `missing:row-${index}`;
};

// =============================================================================
// CSV PROCESSING FUNCTIONS
// =============================================================================

const escapeCsvValue = (value: string): string => {
  if (value === undefined || value === null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const updateCsvWithGeneratedIds = async (
  filePath: string,
  generatedIds: Map<string, string>
): Promise<Result<{ updated: boolean }>> => {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: new Error(`CSV file not found: ${filePath}`) };
  }

  const rows: Array<Record<string, string>> = [];
  let headers: string[] = [];

  const readResult: Result<void> = await new Promise((resolve) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("headers", (headerList: string[]) => {
        headers = headerList;
      })
      .on("data", (row: Record<string, string>) => {
        rows.push(row);
      })
      .on("end", () => resolve({ ok: true, value: undefined }))
      .on("error", (error: Error) => resolve({ ok: false, error }));
  });

  if (!readResult.ok) return readResult;
  if (!headers.includes(CSV_COLUMNS.productId)) {
    return {
      ok: false,
      error: new Error(`Missing required CSV column header: ${CSV_COLUMNS.productId}`),
    };
  }

  let updated = false;
  for (const [index, row] of rows.entries()) {
    const currentId = getColumnValue(row, CSV_COLUMNS.productId);
    if (!currentId) {
      const groupKey = buildMissingGroupKey(row, index);
      const generatedId = generatedIds.get(groupKey);
      if (generatedId) {
        row[CSV_COLUMNS.productId] = generatedId;
        updated = true;
      }
    }
  }

  if (!updated) return { ok: true, value: { updated: false } };

  const tempPath = `${filePath}.tmp`;
  const output = fs.createWriteStream(tempPath, { encoding: "utf8" });
  output.write(headers.map(escapeCsvValue).join(",") + "\n");
  for (const row of rows) {
    const values = headers.map((header) =>
      Object.prototype.hasOwnProperty.call(row, header) ? row[header] : ""
    );
    output.write(values.map(escapeCsvValue).join(",") + "\n");
  }
  output.end();
  await new Promise<void>((resolve, reject) => {
    output.on("finish", resolve);
    output.on("error", reject);
  });
  fs.renameSync(tempPath, filePath);

  return { ok: true, value: { updated: true } };
};

const readCsvFile = (filePath: string): Result<pl.DataFrame> => {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: new Error(`CSV file not found: ${filePath}`) };
    }
    // Configure CSV parsing to handle quoted fields with commas
    const df = pl.readCSV(filePath, {
      hasHeader: true,
      quoteChar: '"',
      encoding: "utf8",
      ignoreErrors: false,
    });
    return { ok: true, value: df };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
};

// Validate that required CSV headers are present before processing
const validateCsvHeaders = (df: pl.DataFrame): Result<void> => {
  try {
    const present = new Set(df.columns);
    // Required headers: grouping field + category for storage
    const required = [CSV_COLUMNS.productId, CSV_COLUMNS.category];
    const optional = Object.values(CSV_COLUMNS).filter((c) => !required.includes(c));

    const missing = required.filter((c) => !present.has(c));
    const missingOptional = optional.filter((c) => !present.has(c));

    if (missing.length > 0) {
      // Build helpful hints for near matches (case-insensitive)
      const lowerPresent = new Map<string, string>();
      for (const col of df.columns) lowerPresent.set(col.toLowerCase(), col);

      const hints: string[] = [];
      for (const need of missing) {
        const ci = lowerPresent.get(need.toLowerCase());
        if (ci) hints.push(`Hint: Found '${ci}', expected exactly '${need}'.`);
      }

      const allowedColumns = new Set<string>(Object.values(CSV_COLUMNS));
      const extras = df.columns.filter((c) => !allowedColumns.has(c));

      const messageLines = [
        `Missing required CSV column headers: ${missing.join(", ")}`,
        ...(hints.length ? ["", ...hints] : []),
        ...(extras.length
          ? [
              "",
              `Note: Extra columns in CSV (ignored by importer unless mapped): ${extras.join(", ")}`,
            ]
          : []),
        "",
        "Expected required headers (exact match):",
        ...required.map((c) => ` - ${c}`),
        ...(missingOptional.length
          ? [
              "",
              "Optional headers not found (will be treated as empty):",
              ...missingOptional.map((c) => ` - ${c}`),
            ]
          : []),
      ];
      return { ok: false, error: new Error(messageLines.join("\n")) };
    }

    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
};

const groupProductRows = (
  df: pl.DataFrame,
  groupByColumn: string
): Result<Array<{ main: any; variants: any[]; groupKey: string; productId: string }>> => {
  try {
    const rows = df.toRecords();
    const products: Array<{ main: any; variants: any[]; groupKey: string; productId: string }> = [];

    if (GROUPING_CONFIG.strategy === "groupByValue") {
      const productMap = new Map<
        string,
        { main: any; variants: any[]; groupKey: string; productId: string }
      >();

      rows.forEach((row, index) => {
        const productId = getColumnValue(row, groupByColumn);
        const groupKey = productId || buildMissingGroupKey(row, index);
        if (!groupKey) return;

        if (!productMap.has(groupKey)) {
          productMap.set(groupKey, { main: row, variants: [], groupKey, productId });
        } else {
          const existing = productMap.get(groupKey)!;
          existing.variants.push(row);
        }
      });

      products.push(...productMap.values());
    } else if (GROUPING_CONFIG.strategy === "emptyFieldIndicatesVariant") {
      const indicatorColumn = GROUPING_CONFIG.emptyFieldIndicator
        ? CSV_COLUMNS[GROUPING_CONFIG.emptyFieldIndicator]
        : groupByColumn;

      let currentProduct: {
        main: any;
        variants: any[];
        groupKey: string;
        productId: string;
      } | null = null;

      for (const [index, row] of rows.entries()) {
        const indicatorValue = getColumnValue(row, indicatorColumn);

        if (indicatorValue) {
          if (currentProduct) products.push(currentProduct);
          const productId = getColumnValue(row, groupByColumn);
          const groupKey = productId || buildMissingGroupKey(row, index);
          currentProduct = { main: row, variants: [], groupKey, productId };
        } else if (currentProduct) {
          currentProduct.variants.push(row);
        }
      }

      if (currentProduct) products.push(currentProduct);
    }

    return { ok: true, value: products };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
};

// =============================================================================
// PRODUCT TRANSFORMATION
// =============================================================================

const transformProduct = (prod: {
  main: any;
  variants: any[];
  groupKey: string;
  productId: string;
}): { productData: ProductData; productId: string; groupKey: string } => {
  const main = prod.main;
  const variantRows = [main, ...prod.variants];
  const parentPriceCents = parsePriceToCents(main[CSV_COLUMNS.price]);

  // Check if this product has actual shades (not just empty shade fields)
  const hasActualShades = variantRows.some((v) => {
    const shadeName = getColumnValue(v, CSV_COLUMNS.shadeName);
    return shadeName && shadeName !== "-" && shadeName.trim() !== "";
  });

  let variants: ProductVariant[];

  if (hasActualShades) {
    // Product has shades - create variants for each shade
    variants = variantRows.map((v: any): ProductVariant => {
      const rawSku = getColumnValue(v, CSV_COLUMNS.sku);
      const sku = rawSku && rawSku !== "-" ? rawSku : "";

      const rawProductCode = getColumnValue(v, CSV_COLUMNS.productCode);
      const productCode = rawProductCode && rawProductCode !== "-" ? rawProductCode : undefined;

      const shadeName = getColumnValue(v, CSV_COLUMNS.shadeName);
      const shadeCode = getColumnValue(v, CSV_COLUMNS.shadeCode);
      const hexCode = getColumnValue(v, CSV_COLUMNS.hexCode);

      const shade: Shade | undefined =
        shadeName && shadeName !== "-"
          ? { name: shadeName, code: shadeCode, hexCode, slug: slugifySegment(shadeName) }
          : undefined;

      const ownPriceCents = parsePriceToCents(v[CSV_COLUMNS.price]);
      const amount = ownPriceCents > 0 ? ownPriceCents : parentPriceCents;

      const size = parseSize(v[CSV_COLUMNS.quantity]);
      const variantLink = getColumnValue(v, CSV_COLUMNS.productLink);
      const stockRaw = getColumnValue(v, CSV_COLUMNS.stock);
      const quantity = parseQuantity(v[CSV_COLUMNS.stock]);

      return {
        sku,
        productCode,
        price: { amount, currency: "INR" },
        inventory: {
          quantity,
          available: quantity > 0,
          ...(stockRaw && { stock: stockRaw }),
        },
        shade,
        size,
        productLink: variantLink || undefined,
        images: [],
      };
    });
  } else {
    // Product has no shades - create single variant from main row only
    const v = main;
    const rawSku = getColumnValue(v, CSV_COLUMNS.sku);
    const sku = rawSku && rawSku !== "-" ? rawSku : "";

    const rawProductCode = getColumnValue(v, CSV_COLUMNS.productCode);
    const productCode = rawProductCode && rawProductCode !== "-" ? rawProductCode : undefined;

    const ownPriceCents = parsePriceToCents(v[CSV_COLUMNS.price]);
    const amount = ownPriceCents > 0 ? ownPriceCents : parentPriceCents;

    const size = parseSize(v[CSV_COLUMNS.quantity]);
    const variantLink = getColumnValue(v, CSV_COLUMNS.productLink);
    const stockRaw = getColumnValue(v, CSV_COLUMNS.stock);
    const quantity = parseQuantity(v[CSV_COLUMNS.stock]);

    variants = [
      {
        sku,
        productCode,
        price: { amount, currency: "INR" },
        inventory: {
          quantity,
          available: quantity > 0,
          ...(stockRaw && { stock: stockRaw }),
        },
        shade: undefined, // Explicitly no shade
        size,
        productLink: variantLink || undefined,
        images: [],
      },
    ];
  }

  const sortedVariants = sortVariants(variants);

  const topLevelCategory = getColumnValue(main, CSV_COLUMNS.category);
  const category =
    normalizeTopCategory(topLevelCategory) || slugifySegment(topLevelCategory) || "uncategorized";

  const productName = getColumnValue(main, CSV_COLUMNS.productName);
  const safeName = productName || topLevelCategory || "Unknown Product";

  const productId = prod.productId;

  const tagline = getColumnValue(main, CSV_COLUMNS.tagline);
  const shortDescription = getColumnValue(main, CSV_COLUMNS.shortDescription);
  const description = getColumnValue(main, CSV_COLUMNS.description);
  const keyBenefitsRaw = getColumnValue(main, CSV_COLUMNS.keyBenefits);
  const ingredientsRaw = getColumnValue(main, CSV_COLUMNS.ingredients);
  const howToUse = getColumnValue(main, CSV_COLUMNS.howToUse);
  const caution = getColumnValue(main, CSV_COLUMNS.caution);
  const shippingAndDelivery = getColumnValue(main, CSV_COLUMNS.shippingAndDelivery);
  const productLink = getColumnValue(main, CSV_COLUMNS.productLink);

  const productData: ProductData = {
    name: safeName,
    description,
    shortDescription,
    category,
    variants: sortedVariants,
    tagline,
    keyBenefits: keyBenefitsRaw
      .split(FIELD_SEPARATORS.keyBenefits)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .sort(),
    ingredients: ingredientsRaw
      .split(FIELD_SEPARATORS.ingredients)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .sort(),
    howToUse,
    caution,
    shippingAndDelivery,
    productLink,
    heroImage: "",
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  return { productData, productId, groupKey: prod.groupKey };
};

// =============================================================================
// VARIANT FIELD MERGING
// =============================================================================

/**
 * Generates a unique key for a variant using multiple fallback strategies.
 * Priority: SKU (if non-empty) → shade.name → productCode → null
 */
const getVariantKey = (variant: ProductVariant): string | null => {
  // Priority 1: Non-empty SKU
  if (variant.sku && variant.sku.trim() !== "") {
    return `sku:${variant.sku}`;
  }
  // Priority 2: Shade name (for products with multiple shades)
  if (variant.shade?.name && variant.shade.name.trim() !== "") {
    return `shade:${variant.shade.name}`;
  }
  // Priority 3: Product code
  if (variant.productCode && variant.productCode.trim() !== "") {
    return `productCode:${variant.productCode}`;
  }
  return null;
};

/**
 * Merges specific fields from new variants into existing variants.
 * Uses smart matching with fallback strategies:
 * 1. Match by SKU (if non-empty)
 * 2. Match by shade.name (for products with shades)
 * 3. Match by productCode (legacy product code)
 * 4. Match by position (for single-variant products or when all else fails)
 *
 * Optimized for performance:
 * - Uses Map for O(N+M) lookup instead of O(N*M) with find()
 * - Only creates new variant object if values actually changed
 */
const mergeVariantFields = (
  existingVariants: ProductVariant[],
  newVariants: ProductVariant[],
  fieldsToUpdate: Array<keyof ProductVariant>
): ProductVariant[] => {
  // Build maps for multiple matching strategies
  const newVariantsByKey = new Map<string, ProductVariant>();
  newVariants.forEach((v, index) => {
    const key = getVariantKey(v);
    if (key) {
      newVariantsByKey.set(key, v);
    }
    // Also index by position for fallback
    newVariantsByKey.set(`position:${index}`, v);
  });

  return existingVariants.map((existing, index) => {
    // Try matching strategies in priority order
    const existingKey = getVariantKey(existing);
    let match = existingKey ? newVariantsByKey.get(existingKey) : null;

    // Fallback to position-based matching if no key match and same count
    if (!match && existingVariants.length === newVariants.length) {
      match = newVariantsByKey.get(`position:${index}`);
    }

    if (!match) return existing;

    // Track if any field actually changed to avoid unnecessary updates
    const updated = { ...existing };
    let hasChanged = false;

    for (const field of fieldsToUpdate) {
      const newValue = match[field];
      const oldValue = (existing as any)[field];

      // Only update if the new value is defined and different
      if (newValue !== undefined && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        (updated as any)[field] = newValue;
        hasChanged = true;
      }
    }

    // Return existing object reference if nothing changed (avoids unnecessary Firestore writes)
    return hasChanged ? updated : existing;
  });
};

// =============================================================================
// FIRESTORE OPERATIONS
// =============================================================================

const fetchExistingProducts = async (
  db: admin.firestore.Firestore
): Promise<Result<Map<string, { id: string; data: any }>>> => {
  try {
    const snapshot = await db.collection("products").get();
    const existingProducts = new Map<string, { id: string; data: any }>();
    snapshot.forEach((doc) => {
      existingProducts.set(doc.id, { id: doc.id, data: doc.data() });
    });
    return { ok: true, value: existingProducts };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
};

const prepareBatchOperations = (
  products: Array<{ productData: ProductData; productId: string }>,
  existingProducts: Map<string, { id: string; data: any }>,
  updateFields: Array<keyof ProductData> | null,
  updateVariantFields: Array<keyof ProductVariant> | null,
  db: admin.firestore.Firestore
): {
  batch: admin.firestore.WriteBatch;
  operations: Array<{ type: "add" | "update" | "unchanged"; name: string }>;
} => {
  const batch = db.batch();
  const operations: Array<{ type: "add" | "update" | "unchanged"; name: string }> = [];
  const fieldsToCheckList: Array<keyof ProductData> = updateFields || ALLOWED_PRODUCT_FIELDS;

  for (const { productData, productId } of products) {
    const existing = existingProducts.get(productId);

    if (existing) {
      const normalizedExisting: Partial<ProductData> = { ...existing.data };
      delete normalizedExisting.createdAt;
      delete normalizedExisting.updatedAt;

      const normalizedNew: Partial<ProductData> = { ...productData };
      delete normalizedNew.createdAt;
      delete normalizedNew.updatedAt;

      if (JSON.stringify(normalizedExisting) === JSON.stringify(normalizedNew)) {
        operations.push({ type: "unchanged", name: productData.name });
      } else {
        const updateData: any = {};

        // Handle variant field-level updates
        if (updateVariantFields && updateVariantFields.length > 0 && existing.data.variants) {
          // Merge specific variant fields instead of replacing entire variants array
          const mergedVariants = mergeVariantFields(
            existing.data.variants as ProductVariant[],
            productData.variants,
            updateVariantFields
          );
          if (JSON.stringify(existing.data.variants) !== JSON.stringify(mergedVariants)) {
            updateData.variants = mergedVariants;
          }
        }

        // Handle regular product field updates
        for (const field of fieldsToCheckList) {
          // Skip variants if we're doing variant-level updates
          if (field === "variants" && updateVariantFields && updateVariantFields.length > 0) {
            continue;
          }
          if (
            JSON.stringify((normalizedExisting as any)[field]) !==
            JSON.stringify((normalizedNew as any)[field])
          ) {
            updateData[field] = (normalizedNew as any)[field];
          }
        }

        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
          batch.update(db.collection("products").doc(productId), updateData);
          operations.push({ type: "update", name: productData.name });
        } else {
          operations.push({ type: "unchanged", name: productData.name });
        }
      }
    } else {
      batch.set(db.collection("products").doc(productId), productData);
      operations.push({ type: "add", name: productData.name });
    }
  }

  return { batch, operations };
};

// =============================================================================
// MAIN EXECUTION
// =============================================================================

const main = async (): Promise<void> => {
  const program = new Command();

  program
    .name("import-products-polars")
    .description("Import and sync product data from CSV to Firestore")
    .version("1.0.0")
    .requiredOption("--csv <path>", "Path to CSV file containing product data")
    .option(
      "--no-fill-missing-product-ids",
      "Skip auto-generating missing Product IDs and updating the CSV"
    )
    .option(
      "--sample <number>",
      "Import only N random sample products from CSV (for testing)",
      parseInt
    )
    .option(
      "--product-names <names>",
      "Import/update only specific products by name (comma-separated list)"
    )
    .option(
      "--product-ids <ids>",
      "Import/update only specific products by Product ID (comma-separated list)"
    )
    .option("--dry-run", "Parse CSV and show what would be imported without writing to database")
    .option("--production", "Write to production Firestore (ignores emulator settings)")
    .option("--project <id>", "Override Firebase project ID (default: itsme-fashion)")
    .option(
      "--database-id <id>",
      "Override Firestore database ID (default: FIRESTORE_DATABASE_ID or (default))"
    )
    .option("--service-account <path>", "Path to Firebase service account JSON file")
    .option(
      "--update-fields <fields>",
      "Update only specific fields (comma-separated: name,description,variants,etc.)"
    )
    .option(
      "--update-variant-fields <fields>",
      "Update only specific variant fields (comma-separated: productCode,price,inventory). Merges with existing variants by sku."
    )
    .addHelpText(
      "after",
      `
EXAMPLES:
  $ import-products-polars --csv ../assets/products.csv --dry-run
  $ import-products-polars --csv ../assets/products.csv --sample 5
  $ import-products-polars --csv ../assets/products.csv --product-names "Kajal,Mascara"
  $ import-products-polars --csv ../assets/products.csv --product-ids "k22NuLsdpgSdZXBq5utI,xMI8dEsVWeIveS2HloqO"
  $ import-products-polars --csv ../assets/products.csv --update-fields variants,description
  $ import-products-polars --csv ../assets/products.csv --update-variant-fields productCode
  $ import-products-polars --csv ../assets/products.csv --no-fill-missing-product-ids
  $ import-products-polars --csv ../assets/products.csv --production --project my-project

OPERATIONS:
  • Import all products from CSV to Firestore
  • Update existing products with new data from CSV
  • Selective import by product names, Product IDs, or sample size
  • Field-specific updates for targeted changes
  • Dry-run mode for validation without database writes
  • Production or emulator environment support

CSV FORMAT:
  Required columns: No, Category, Product name, Product ID
  Optional columns: All other product fields (variants, prices, descriptions, etc.)
  Products are grouped by Product ID column (Firebase document ID)
  Multiple rows with same product ID create variants (shades/sizes)
  Missing Product ID values are auto-generated and written back to the CSV

FIRESTORE TARGET:
  • Emulator: Uses FIRESTORE_EMULATOR_HOST environment variable
  • Production: Requires --production flag and confirmation
  • Project: Uses FIREBASE_PROJECT_ID or --project override
  • Database: Uses FIRESTORE_DATABASE_ID or --database-id override
`
    );

  program.parse();
  const options = program.opts();

  // Helper to parse and validate comma-separated field list CLI options
  const parseFieldListOption = <T extends string>(
    optionValue: string | undefined,
    allowedFields: readonly T[],
    optionName: string
  ): T[] | null => {
    if (!optionValue) return null;

    const rawFields = optionValue.split(",").map((f: string) => f.trim());
    const validFields = rawFields.filter((f): f is T => allowedFields.includes(f as T));

    // Warn about unknown fields
    if (rawFields.length !== validFields.length) {
      const unknown = rawFields.filter((f) => !allowedFields.includes(f as T));
      if (unknown.length) {
        console.warn(`Warning: ignoring unknown ${optionName}: ${unknown.join(", ")}`);
      }
    }

    return validFields.length > 0 ? validFields : null;
  };

  const updateFields = parseFieldListOption(
    options.updateFields,
    ALLOWED_PRODUCT_FIELDS,
    "update-fields"
  );

  const updateVariantFields = parseFieldListOption(
    options.updateVariantFields,
    ALLOWED_VARIANT_FIELDS,
    "update-variant-fields"
  );

  if (!admin.apps.length) {
    const projectId =
      options.project ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      "itsme-fashion";

    let credential: admin.credential.Credential;
    if (options.serviceAccount) {
      const saPath = String(options.serviceAccount);
      if (!fs.existsSync(saPath)) {
        console.error(`Service account file not found: ${saPath}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(saPath, "utf8");
      try {
        const parsed = JSON.parse(raw);
        credential = admin.credential.cert(parsed);
      } catch (err) {
        console.error("Failed to parse service account JSON:", err);
        process.exit(1);
      }
    } else {
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({ credential, projectId });
  }

  const databaseIdRaw = options.databaseId || process.env.FIRESTORE_DATABASE_ID || "";
  const databaseId = String(databaseIdRaw).trim() || undefined;
  const db = databaseId ? getFirestore(admin.app(), databaseId) : getFirestore(admin.app());
  const settings: any = { ignoreUndefinedProperties: true };
  const useEmulator = localhost:8080;
  if (useEmulator) {
    settings.host = process.env.FIRESTORE_EMULATOR_HOST;
    settings.ssl = false;
  }
  db.settings(settings);
  if (!options.dryRun) {
    console.log(
      `Firestore target -> host: ${useEmulator ? process.env.FIRESTORE_EMULATOR_HOST : "production"}, projectId: ${admin.app().options.projectId}, databaseId: ${databaseId || "(default)"}`
    );
  }

  const csvPath = path.resolve(options.csv);
  console.log(`Reading CSV from: ${csvPath}`);
  console.log(`Using column mapping configuration with ${Object.keys(CSV_COLUMNS).length} fields`);

  console.log(
    `Grouping strategy: ${GROUPING_CONFIG.strategy}, grouping by: ${CSV_COLUMNS.productId}`
  );

  const readResult = readCsvFile(csvPath);
  if (!readResult.ok) {
    console.error("Error reading CSV file:", readResult.error.message);
    process.exit(1);
  }

  const df = readResult.value;

  // Validate headers before any transformation
  const headerValidation = validateCsvHeaders(df);
  if (!headerValidation.ok) {
    console.error("CSV header validation failed:\n" + headerValidation.error.message);
    process.exit(1);
  }
  const sampleSize = options.sample ? Math.max(1, options.sample) : 0;
  const dfToProcess = sampleSize > 0 ? df.sample(sampleSize) : df;

  const groupResult = groupProductRows(dfToProcess, CSV_COLUMNS.productId);
  if (!groupResult.ok) {
    console.error("Error grouping product rows:", groupResult.error.message);
    process.exit(1);
  }

  const products = groupResult.value.map((group) => transformProduct(group));
  const generatedIds = new Map<string, string>();

  const productsWithIds = products.map((product) => {
    if (product.productId) return product;
    const newId = db.collection("products").doc().id;
    generatedIds.set(product.groupKey, newId);
    return { ...product, productId: newId };
  });

  if (generatedIds.size > 0 && !options.fillMissingProductIds) {
    console.warn(
      "Generated Product IDs for new products but did not update the CSV because --no-fill-missing-product-ids was set."
    );
  }

  if (generatedIds.size > 0 && options.fillMissingProductIds) {
    const updateResult = await updateCsvWithGeneratedIds(csvPath, generatedIds);
    if (!updateResult.ok) {
      console.error("Failed to update Product IDs in CSV:\n" + updateResult.error.message);
      process.exit(1);
    }
    if (updateResult.value.updated) {
      console.log(`Updated CSV with ${generatedIds.size} generated Product IDs.`);
    }
  }
  console.log(`Parsed ${productsWithIds.length} products from CSV...`);

  // Filter products by name if specified
  let filteredProducts = productsWithIds;
  if (options.productNames) {
    const productNamesFilter = options.productNames
      .split(",")
      .map((name: string) => name.trim().toLowerCase());
    filteredProducts = productsWithIds.filter(({ productData }) =>
      productNamesFilter.includes(productData.name.toLowerCase())
    );
    console.log(
      `Filtered to ${filteredProducts.length} products matching names: ${productNamesFilter.join(", ")}`
    );
  }

  // Filter products by Product ID if specified
  if (options.productIds) {
    const productIdsFilter = options.productIds.split(",").map((id: string) => id.trim());
    filteredProducts = filteredProducts.filter(({ productId }) =>
      productIdsFilter.includes(productId)
    );
    console.log(
      `Filtered to ${filteredProducts.length} products matching IDs: ${productIdsFilter.join(", ")}`
    );
  }

  if (options.dryRun) {
    console.log("\n=== DRY RUN: Parsed Products ===\n");
    filteredProducts.forEach(({ productData, productId }, index) => {
      console.log(`\n--- Product ${index + 1} (ID: ${productId}) ---`);
      console.log(JSON.stringify(productData, null, 2));
    });
    console.log(`\n=== Total: ${filteredProducts.length} products parsed ===`);
    process.exit(0);
  }

  const existingResult = await fetchExistingProducts(db);
  if (!existingResult.ok) {
    console.error("Error fetching existing products:", existingResult.error.message);
    process.exit(1);
  }

  const targetingProduction = Boolean(options.production) || !process.env.FIRESTORE_EMULATOR_HOST;
  if (targetingProduction) {
    console.warn("WARNING: This will sync data to PRODUCTION Firestore.");
    const answer = await askQuestion(
      `Continue and sync ${filteredProducts.length} products into project '${admin.app().options.projectId}'? Type YES to continue: `
    );
    if (answer.trim().toUpperCase() !== "YES") {
      console.log("Aborting sync. No data was written.");
      process.exit(0);
    }
  }

  console.log(`Syncing ${filteredProducts.length} products...`);

  const { batch, operations } = prepareBatchOperations(
    filteredProducts,
    existingResult.value,
    updateFields,
    updateVariantFields,
    db
  );

  try {
    await batch.commit();

    for (const op of operations) {
      const action =
        op.type === "add" ? "Added" : op.type === "update" ? "Updated" : "No changes for";
      console.log(`${action} product: ${op.name}`);
    }

    const added = operations.filter((o) => o.type === "add").length;
    const updated = operations.filter((o) => o.type === "update").length;
    const unchanged = operations.filter((o) => o.type === "unchanged").length;

    console.log(`Sync completed. Added: ${added}, Updated: ${updated}, Unchanged: ${unchanged}`);
  } catch (error) {
    console.error("Error committing batch:", error);
    process.exit(1);
  }

  process.exit(0);
};

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
