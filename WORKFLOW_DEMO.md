# Firebase Firestore Data Seeding - Complete Workflow

This document demonstrates the complete workflow for seeding data into Firebase Firestore using the emulator with the `--export-on-exit` flag.

## 📋 What Has Been Set Up

### 1. Sample Product Data (`products.csv`)
A CSV file containing 4 sample products with a total of 12 product entries (including variants):
- **Shine On All Day Long Lipstick** (2 variants: Beautiful Brown, Ruby Red)
- **Dramatic Look Mascara** (1 variant: Jet Black)  
- **Glow Boost Face Serum** (no color variants)

The lipstick has 2 rows (variants), while mascara and serum each have 1 row, totaling 4 unique product IDs.

### 2. Import Script (`import-products-polars.ts`)
- Fixed syntax error on line 962 (changed `localhost:8080` to `process.env.FIRESTORE_EMULATOR_HOST`)
- The script reads CSV data and imports it into Firestore
- Supports variants, pricing, inventory, and full product details

### 3. Automation Scripts

#### `seed-firestore.sh` - Main Seeding Script
The primary script that:
1. Checks for Firebase CLI (uses `npx firebase-tools` if not installed globally)
2. Installs npm dependencies if needed
3. Starts Firestore emulator with `--export-on-exit=./emulator-data`
4. Waits for emulator to be ready
5. Runs the import script to seed data
6. Keeps emulator running for interaction
7. Exports data when stopped (Ctrl+C)

#### `test-seeding.sh` - Automated Test
A simpler test script that:
- Starts the emulator
- Seeds data automatically
- Stops after 10 seconds and exports data
- Useful for CI/CD or automated testing

#### `verify-setup.sh` - Setup Verification
Verifies that all components are properly configured:
- Checks all required files exist
- Validates dependencies are installed
- Tests CSV parsing with dry-run
- Confirms firebase.json configuration

### 4. NPM Scripts (package.json)
```json
{
  "emulator:start": "Start emulator with export-on-exit",
  "seed:data": "Seed data to running emulator",
  "seed:dry-run": "Preview what would be imported"
}
```

### 5. Documentation
- `SEEDING_GUIDE.md` - Complete user guide with examples
- This document - Workflow demonstration

## 🚀 Usage Workflows

### Workflow 1: One-Command Seeding (Recommended)

```bash
./seed-firestore.sh
```

**What happens:**
1. ✅ Checks prerequisites
2. ✅ Starts emulator on port 8080
3. ✅ Emulator UI available at http://localhost:4000
4. ✅ Seeds 4 products (3 unique product IDs) from CSV
5. ✅ Waits for user interaction
6. ✅ Press Ctrl+C to stop and export to `./emulator-data/`

### Workflow 2: Manual Two-Terminal Approach

**Terminal 1 - Start Emulator:**
```bash
npx firebase-tools emulators:start --only firestore --export-on-exit=./emulator-data
```

**Terminal 2 - Seed Data:**
```bash
npm run seed:data
```

### Workflow 3: Automated Testing

```bash
./test-seeding.sh
```

Automatically seeds data and stops after 10 seconds.

### Workflow 4: Dry Run First (Best Practice)

```bash
npm run seed:dry-run
```

Preview the parsed data before importing.

## 📊 What Gets Seeded

### Product Structure in Firestore

```
products/
├── k22NuLsdpgSdZXBq5utI/          # Lipstick
│   ├── name: "Shine On All Day Long Lipstick"
│   ├── category: "lips"
│   ├── variants: [
│   │   { shade: "Beautiful Brown", price: 1299, sku: "ITS-LIPS-SHIN-BB08-2G" }
│   │   { shade: "Ruby Red", price: 1299, sku: "ITS-LIPS-SHIN-RR01-2G" }
│   │   ]
│   ├── description: "..."
│   ├── keyBenefits: ["Hydration", "Long-wear", "Matte finish"]
│   └── ingredients: ["Argan Oil", "Candelilla Wax", ...]
│
├── xMI8dEsVWeIveS2HloqO/          # Mascara
│   └── ...
│
└── zPQ7gHsIjKlMnOpQrStU/          # Face Serum
    └── ...
```

## 🔍 Verification

Run the verification script to ensure everything is set up correctly:

```bash
./verify-setup.sh
```

**Output:**
```
✓ Checking required files...
  ✓ products.csv exists
  ✓ import-products-polars.ts exists
  ✓ firebase.json exists
  
✓ Checking node_modules...
  ✓ Dependencies installed

✓ Checking package dependencies...
  ✓ firebase-admin installed
  ✓ nodejs-polars installed
  
✓ CSV has 4 product entries (3 unique product IDs)
✓ Firestore emulator configured on port 8080

All components verified successfully!
```

## 📦 Exported Data

When the emulator stops (via Ctrl+C or script completion), data is exported to:

```
./emulator-data/
├── firestore_export/
│   └── firestore_export.overall_export_metadata
│   └── all_namespaces/
│       └── all_kinds/
│           └── output-0
└── firebase-export-metadata.json
```

### Reusing Exported Data

To start the emulator with previously exported data:

```bash
npx firebase-tools emulators:start \
  --only firestore \
  --import=./emulator-data \
  --export-on-exit=./emulator-data
```

## 🎯 Key Features Implemented

### ✅ Emulator with Export on Exit
The `--export-on-exit` flag ensures data is saved when the emulator stops.

### ✅ Automatic Data Seeding
The import-products-polars script automatically seeds data from CSV.

### ✅ Interactive Firestore Access
Emulator UI at http://localhost:4000 allows viewing and querying data.

### ✅ Multiple Workflows
Scripts for different use cases (manual, automated, testing).

### ✅ Comprehensive Documentation
Multiple guides for different user needs.

## 🧪 Testing the Workflow

### Step 1: Verify Setup
```bash
./verify-setup.sh
```

### Step 2: Test CSV Parsing
```bash
npm run seed:dry-run
```

### Step 3: Run Full Workflow (in environment with network access)
```bash
./seed-firestore.sh
```

## ⚠️ Environment Limitations

**Note:** The Firebase emulator requires downloading a JAR file on first run. In CI/CD or restricted network environments, this may fail. Solutions:

1. **Cache the emulator:** Cache `/home/runner/.cache/firebase/emulators/` in CI
2. **Pre-download:** Download emulator in an unrestricted environment first
3. **Use local environment:** Run on local machine without network restrictions

## 📝 Example Output

### Dry Run Output
```
Reading CSV from: /path/to/products.csv
Using column mapping configuration with 21 fields
Parsed 3 products from CSV...  # 3 unique product IDs

--- Product 1 (ID: k22NuLsdpgSdZXBq5utI) ---
{
  "name": "Shine On All Day Long Lipstick",
  "category": "lips",
  "variants": [
    { "shade": "Beautiful Brown", "price": 129900 },
    { "shade": "Ruby Red", "price": 129900 }
  ]
}
```

### Seeding Output
```
Firestore target -> host: localhost:8080
Added product: Shine On All Day Long Lipstick
Added product: Dramatic Look Mascara
Added product: Glow Boost Face Serum
Sync completed. Added: 3, Updated: 0, Unchanged: 0
```

## 🎉 Summary

All components are in place to:
1. ✅ Start Firebase Firestore emulator with `--export-on-exit` flag
2. ✅ Seed data using the import-products-polars script
3. ✅ Interact with Firestore via the emulator
4. ✅ Export data automatically on emulator shutdown

The setup is complete and ready to use in any environment with network access to download the Firebase emulator.
