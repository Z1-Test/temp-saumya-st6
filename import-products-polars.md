# Import Products Polars Script Documentation

## Overview

The `import-products-polars.ts` script is a powerful tool for importing and synchronizing product
data from CSV files to Firestore. It uses Polars for efficient CSV processing and Firebase Admin SDK
for database operations.

### Key Features

- **Efficient CSV Processing**: Uses Polars for fast data manipulation
- **Flexible Product Matching**: Supports matching by Product ID or product name
- **Selective Updates**: Update specific fields only, not entire documents
- **Batch Operations**: Optimized Firestore batch writes for performance
- **Dry Run Mode**: Preview changes before applying them
- **Variant Support**: Handles products with multiple variants (shades, sizes)
- **Environment Support**: Works with both emulator and production Firestore

## Setup

### Prerequisites

- Node.js 22+
- Firebase project with Firestore enabled
- Service account key (for production) or emulator setup

### Installation

The script is located in `src/devops/scripts/import-products-polars.ts` and uses dependencies from
the monorepo.

### Environment Setup

#### For Emulator (Development)

```bash
# Start Firebase emulators
npm run emulators:start

# Set environment variable
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

#### For Production

```bash
# Set service account path
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Or use --service-account flag
```

```bash
# Optional: target a named Firestore database
export FIRESTORE_DATABASE_ID=dev-db
```

## Usage

### Basic Syntax

```bash
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv <path-to-csv> [options]
```

### Command-Line Options

| Option                          | Description                                 | Example                                     |
| ------------------------------- | ------------------------------------------- | ------------------------------------------- |
| `--csv <path>`                  | **Required.** Path to CSV file              | `--csv ../assets/products.csv`              |
| `--product-ids <ids>`           | Update specific products by Product ID      | `--product-ids "id1,id2,id3"`               |
| `--product-names <names>`       | Update specific products by name            | `--product-names "Lipstick,Mascara"`        |
| `--update-fields <fields>`      | Update only specific fields                 | `--update-fields name,description,variants` |
| `--sample <number>`             | Process only N random products              | `--sample 5`                                |
| `--dry-run`                     | Preview changes without writing to database | `--dry-run`                                 |
| `--production`                  | Write to production Firestore               | `--production`                              |
| `--project <id>`                | Override Firebase project ID                | `--project my-project`                      |
| `--database-id <id>`            | Override Firestore database ID              | `--database-id dev-db`                      |
| `--service-account <path>`      | Path to service account JSON                | `--service-account ./key.json`              |
| `--no-fill-missing-product-ids` | Skip CSV updates when Product ID is missing | `--no-fill-missing-product-ids`             |

### Available Update Fields

The following fields can be updated individually:

- `name` - Product name
- `description` - Full product description
- `shortDescription` - Brief description
- `category` - Product category
- `variants` - Product variants (shades, sizes, prices)
- `tagline` - Product tagline
- `keyBenefits` - List of key benefits
- `ingredients` - Ingredient list
- `howToUse` - Usage instructions
- `caution` - Safety warnings
- `shippingAndDelivery` - Shipping information
- `productLink` - External product link
- `heroImage` - Main product image URL
- `issueUrl` - GitHub issue URL
- `status` - Product status (active/inactive)

## CSV Format Requirements

### Required Columns

| Column Name      | Description                                       | Example                          |
| ---------------- | ------------------------------------------------- | -------------------------------- |
| **Product ID**   | Unique identifier (becomes Firestore document ID) | `k22NuLsdpgSdZXBq5utI`           |
| **Category**     | Product category                                  | `lips`                           |
| **Product name** | Display name                                      | `Shine On All Day Long Lipstick` |

### Optional Columns

| Column Name         | Description                            | Example                              |
| ------------------- | -------------------------------------- | ------------------------------------ |
| No                  | Row number/identifier                  | `1`                                  |
| Shade Name          | Variant shade name                     | `Beautiful Brown`                    |
| Shade Code          | Variant shade code                     | `08`                                 |
| Hex Code            | Color hex value                        | `#4a120a`                            |
| Price               | Product/variant price                  | `₹1299`                              |
| Quantity            | Size/weight                            | `2.0 gms`                            |
| Stock               | Inventory quantity                     | `500`                                |
| SKU                 | Actual variant SKU                     | `ITS-LIPS-SHIN-BB08-2G`              |
| Product Code        | Legacy product code for image matching | `BB08`                               |
| Tagline             | Marketing tagline                      | `Shine On All Day Long`              |
| Short Description   | Brief description                      | `Long-lasting lipstick...`           |
| Description         | Full description                       | `Say hello to luminous lips...`      |
| Key Benefits        | Benefits (newline-separated)           | `Hydration\nLong-wear\nMatte finish` |
| Ingredients         | Ingredients (comma-separated)          | `Argan Oil, Candelilla Wax, ...`     |
| How to Use          | Usage instructions                     | `Apply directly to lips...`          |
| Caution             | Safety warnings                        | `Discontinue if irritation occurs`   |
| Shipping & Delivery | Shipping info                          | `Swift order fulfillment...`         |
| Product Link        | External URL                           | `https://example.com/product`        |
| URL                 | GitHub issue                           | `https://github.com/.../issues/123`  |

### Product Grouping Rules

- Products are grouped by the **Product ID** column
- Multiple rows with the same Product ID create variants
- Each variant can have different shades, sizes, prices, etc.
- If no shades are present, a single variant is created from the main row
- If **Product ID** is empty, the script generates a Firestore document ID, writes the product using
  that ID, and updates the CSV so future runs use the same ID

## Usage Examples

### 1. Full Import (Development)

```bash
# Import all products to emulator
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv --dry-run
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv
```

### 2. Production Import

```bash
# Import to production with confirmation
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv --production
```

### 2b. Named Firestore Database (Dev/Staging)

```bash
# Use a non-default database ID
node --experimental-strip-types src/devops/scripts/import-products-polars.ts \
  --csv ../assets/products.csv \
  --database-id dev-db
```

### 3. Selective Updates

```bash
# Update only specific products by ID
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv \
  --product-ids "k22NuLsdpgSdZXBq5utI,xMI8dEsVWeIveS2HloqO" \
  --update-fields variants,description

# Update products by name
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv \
  --product-names "Lipstick,Mascara" \
  --update-fields name,category
```

### 4. Field-Specific Updates

```bash
# Update only prices and inventory
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv \
  --update-fields variants

# Update product descriptions
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv \
  --update-fields description,shortDescription
```

### 5. Testing and Validation

```bash
# Dry run to preview changes
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv --dry-run

# Test with sample data
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv --sample 3 --dry-run
```

## Data Flow

### 1. CSV Reading

- Reads CSV using Polars for efficient processing
- Validates required headers
- Generates Firestore document IDs for rows missing Product ID and updates the CSV (unless disabled)
- Groups rows by Product ID

### 2. Data Transformation

- Converts CSV rows to ProductData structure
- Handles variant creation (shades, sizes)
- Parses prices, quantities, and other fields
- Sorts variants consistently

### 3. Firestore Operations

- Fetches existing products for comparison
- Compares new vs existing data
- Creates batch operations (add/update/skip)
- Commits changes in optimized batches

### 4. Result Reporting

- Shows operation summary (added/updated/unchanged)
- Provides detailed logs for each product

## Best Practices

### 1. Always Use Dry Run First

```bash
# Preview changes before applying
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv --dry-run
```

### 2. Test with Small Samples

```bash
# Test with 2-3 products first
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv --sample 3 --dry-run
```

### 3. Use Selective Updates

```bash
# Update only what changed
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv \
  --update-fields variants,description
```

### 4. Backup Before Production Updates

```bash
# Export current data before bulk updates
firebase emulators:export ./backup --project your-project
```

### 5. Use Product IDs for Precision

```bash
# More reliable than product names
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv \
  --product-ids "exact-id-here"
```

## Troubleshooting

### Common Issues

#### 1. CSV Header Validation Errors

**Error**: `Missing required CSV column headers: Product ID`

**Solution**: Ensure your CSV has the exact column names:

- `Product ID` (not `product_id` or `ProductID`)
- `Category`
- `Product name`

#### 2. Firebase Connection Issues

**Error**: `Error fetching existing products`

**Solutions**:

- Check emulator is running: `firebase emulators:start`
- Verify service account permissions
- Confirm project ID is correct

#### 3. Field Update Warnings

**Warning**: `Warning: ignoring unknown update-fields: invalidField`

**Solution**: Use only valid field names from the allowed list above.

#### 4. Memory Issues with Large CSVs

**Solution**: Process in smaller batches:

```bash
# Process in chunks
node --experimental-strip-types src/devops/scripts/import-products-polars.ts --csv ../assets/products.csv --sample 100
```

### Debug Mode

Add debug logging by modifying the script temporarily:

```typescript
console.log("Debug - Product ID:", productId);
console.log("Debug - Product Data:", productData);
```

## Advanced Usage

### Custom Field Separators

The script uses these separators for multi-value fields:

```typescript
const FIELD_SEPARATORS = {
  keyBenefits: "\\n", // Newline-separated benefits
  ingredients: ",", // Comma-separated ingredients
};
```

### Category Normalization

Categories are automatically normalized:

- `hair` → `hairs`
- `lip` → `lips`
- Custom categories are slugified

### Variant Sorting

Variants are sorted by:

1. Shade name (if available)
2. Shade code
3. SKU
4. Price

## Integration with Other Scripts

### Image Upload Script

After importing products, upload images:

```bash
# Upload and link product images
npm run images:upload-link:polars ../assets/products
```

### Product Data Generation

If Product IDs are missing, the importer will generate Firestore IDs and update the CSV
automatically.

## Performance Considerations

- **Batch Size**: Firestore batches are optimized automatically
- **Memory Usage**: Large CSVs are processed efficiently with Polars
- **Network**: Batch operations reduce Firestore calls
- **Indexing**: Ensure Product ID field is indexed in Firestore

## Security Notes

- Never commit service account keys to version control
- Use environment variables for sensitive configuration
- Always test with emulator before production deployments
- Implement proper access controls on Firestore collections

## Support

For issues or questions:

1. Check the dry-run output for data validation
2. Verify CSV format matches requirements
3. Test with small sample sizes first
4. Review Firebase emulator logs for connection issues

## Changelog

### v1.0.0

- Initial release with Polars integration
- Product ID-based matching
- Selective field updates
- Batch operations support
- Dry-run mode
- Variant processing
- Environment flexibility
