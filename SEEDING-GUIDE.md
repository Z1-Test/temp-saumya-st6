# Firebase Firestore Data Seeding

This directory contains scripts and configuration for seeding data into Firebase Firestore using the `import-products-polars` script with the Firebase emulator.

## Overview

The seeding process:
1. Starts the Firebase Firestore emulator with the `--export-on-exit` flag
2. Waits for the emulator to be ready
3. Runs the `import-products-polars.ts` script to import data from a CSV file
4. Allows you to interact with the Firestore emulator
5. When you exit, automatically exports the emulator data to `./firestore-data`

## Prerequisites

- Node.js 22+ (currently using v22.22.0)
- npm 10+ (currently using v10.9.4)

## Installation

Install the required dependencies:

```bash
npm install
```

This will install:
- `firebase-tools` - Firebase CLI with emulator support
- `firebase-admin` - Firebase Admin SDK for Node.js
- `nodejs-polars` - Efficient CSV processing library
- `commander` - Command-line argument parsing
- `csv-parser` - CSV parsing utilities

## Usage

### Quick Start

Run the complete seeding process with the provided sample data:

```bash
npm run seed:data
```

This command will:
1. Start the Firebase emulator on port 8080
2. Configure it to export data on exit to `./firestore-data`
3. Import products from `sample-products.csv`
4. Keep the emulator running for interaction
5. Export data when you press Enter to exit

### Manual Steps

If you prefer to run steps manually:

#### 1. Start Emulator with Export-on-Exit

```bash
npm run emulators:export
```

Or directly with Firebase CLI:

```bash
firebase emulators:start --only firestore --export-on-exit=./firestore-data
```

#### 2. In Another Terminal, Run Import Script

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
node --experimental-strip-types import-products-polars.ts --csv sample-products.csv
```

### Custom CSV File

To use your own CSV file:

```bash
# Edit seed-firestore-data.js and change the CSV_FILE constant
# Or run the import script manually:
export FIRESTORE_EMULATOR_HOST=localhost:8080
node --experimental-strip-types import-products-polars.ts --csv /path/to/your/file.csv
```

## Sample Data

The repository includes `sample-products.csv` with test product data:
- 2 products (1 with variants, 1 without)
- 3 total records
- Demonstrates both simple and multi-variant products

### CSV Format

The CSV must include these required columns:
- `Product ID` - Unique identifier (will be the Firestore document ID)
- `Category` - Product category (e.g., "lips", "skin", "hair")
- `Product name` - Display name for the product

See `import-products-polars.md` for complete CSV format documentation.

## Interacting with Firestore

Once the emulator is running, you can:

### 1. Access Emulator UI

Open http://localhost:4000 in your browser (if UI is enabled)

### 2. Query Data via Scripts

```javascript
// example-query.js
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'demo-project'
});

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const db = admin.firestore();

async function queryProducts() {
  const snapshot = await db.collection('products').get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

queryProducts();
```

Run with:
```bash
node example-query.js
```

### 3. Import Previously Exported Data

If you have previously exported data in `./firestore-data`:

```bash
firebase emulators:start --only firestore --import=./firestore-data
```

## Configuration

### Firebase Configuration

The `firebase.json` file configures:
- Firestore emulator port: 8080
- Firestore rules: `firestore.rules`
- Firestore indexes: `firestore.indexes.json`

### Script Configuration

Edit `seed-firestore-data.js` to customize:
- `EMULATOR_PORT` - Firestore emulator port (default: 8080)
- `EXPORT_DIR` - Export directory (default: ./firestore-data)
- `CSV_FILE` - CSV file to import (default: ./sample-products.csv)

## Exported Data Structure

After running the seeding process, you'll find exported data in `./firestore-data/`:

```
firestore-data/
├── firestore_export/
│   └── firestore_export.overall_export_metadata
│   └── all_namespaces/
│       └── all_kinds/
│           └── output-0
└── firebase-export-metadata.json
```

This data can be:
- Re-imported into the emulator for testing
- Used as a backup
- Committed to version control for consistent test data

## Troubleshooting

### Emulator Not Starting

**Error**: "Port 8080 already in use"

**Solution**: Stop any processes using port 8080:
```bash
lsof -ti:8080 | xargs kill -9
```

Or change the port in `firebase.json`.

### Import Script Fails

**Error**: "Cannot connect to Firestore"

**Solution**: Ensure the emulator is running and `FIRESTORE_EMULATOR_HOST` is set:
```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Missing Dependencies

**Error**: "Cannot find module 'nodejs-polars'"

**Solution**: Install dependencies:
```bash
npm install
```

### CSV Format Errors

**Error**: "Missing required CSV column headers"

**Solution**: Ensure your CSV has exactly these column names:
- `Product ID`
- `Category`
- `Product name`

See `import-products-polars.md` for complete format requirements.

## NPM Scripts Reference

- `npm run emulators:start` - Start emulator (no export on exit)
- `npm run emulators:export` - Start emulator with export on exit
- `npm run seed:data` - Complete automated seeding process

## Advanced Usage

### Dry Run Before Importing

Test the import without writing to Firestore:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
node --experimental-strip-types import-products-polars.ts --csv sample-products.csv --dry-run
```

### Import Specific Products

Import only specific products by ID:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
node --experimental-strip-types import-products-polars.ts \
  --csv sample-products.csv \
  --product-ids "test-prod-001,test-prod-002"
```

### Update Specific Fields Only

Update only certain fields without replacing entire documents:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
node --experimental-strip-types import-products-polars.ts \
  --csv sample-products.csv \
  --update-fields "variants,description"
```

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Run seeding process: `npm run seed:data`
3. ✅ Interact with Firestore emulator
4. ✅ Verify data is exported when you exit
5. 📝 Replace `sample-products.csv` with your actual product data
6. 🔄 Re-run the seeding process as needed

## Related Documentation

- `import-products-polars.md` - Complete import script documentation
- `firebase.json` - Firebase emulator configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore indexes configuration

## Support

For issues with:
- **Import script**: See `import-products-polars.md`
- **Firebase emulator**: See [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- **CSV format**: See required columns section above
