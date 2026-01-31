# Firestore Data Seeding Guide

This repository contains scripts and configurations for seeding Firebase Firestore data using the `import-products-polars.ts` script with the Firebase emulator.

## Overview

This setup allows you to:
1. Start the Firebase Firestore emulator with `--export-on-exit` flag
2. Seed product data from a CSV file using the `import-products-polars.ts` script
3. Interact with Firestore to verify the data
4. Export the emulator data when stopping the emulator

## Prerequisites

- Node.js 22+
- Java 21+ (required for Firebase Emulator)
- Firebase CLI (installed via npm)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `firebase-admin` - Firebase Admin SDK for Firestore operations
- `firebase-tools` - Firebase CLI including emulators
- `nodejs-polars` - Fast CSV processing library
- `commander` - CLI argument parsing
- `csv-parser` - CSV parsing utilities

### 2. Run the Complete Seeding Process

```bash
npm run seed-firestore
```

Or run the script directly:

```bash
./seed-firestore.sh
```

This automated script will:
1. Start the Firebase Firestore emulator on port 8080
2. Configure emulator to import existing data from `./emulator-data`
3. Configure emulator to export data on exit to `./emulator-data`
4. Run the `import-products-polars.ts` script to seed products from `sample-products.csv`
5. Verify the imported data by querying Firestore
6. Stop the emulator (triggering the data export)

### 3. Manual Step-by-Step Process

If you prefer to run the steps manually:

#### Step 1: Start the Emulator

```bash
npm run emulator:start
```

Or directly:

```bash
npx firebase emulators:start --only firestore --import=./emulator-data --export-on-exit=./emulator-data
```

This starts the Firestore emulator with:
- Port: `8080`
- Import data from: `./emulator-data` (if exists)
- Export data on exit to: `./emulator-data`

#### Step 2: Import Products (in a separate terminal)

```bash
npm run import-products
```

Or directly:

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 node --experimental-strip-types import-products-polars.ts --csv sample-products.csv
```

This will:
- Connect to the Firestore emulator running on `localhost:8080`
- Read product data from `sample-products.csv`
- Import products into the `products` collection
- Show a summary of added/updated/unchanged products

#### Step 3: Verify Data

You can verify the data in several ways:

**Option A: Using the Firestore Emulator UI**

Navigate to `http://localhost:4000` (Emulator UI) and browse the `products` collection.

**Option B: Using a verification script**

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 node verify-data.js
```

**Option C: Using Firebase CLI**

```bash
npx firebase emulators:export ./backup
```

#### Step 4: Stop the Emulator

Press `Ctrl+C` in the terminal running the emulator. The emulator will automatically export the data to `./emulator-data` before shutting down.

## Understanding the Components

### firebase.json

Contains the Firebase configuration:

```json
{
  "emulators": {
    "firestore": {
      "port": 8080
    }
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### sample-products.csv

A sample CSV file containing product data with the following structure:
- Product ID, Category, Product name
- Shade variants (shade name, shade code, hex code)
- Pricing and inventory information
- Product descriptions and metadata

### import-products-polars.ts

The main import script that:
- Reads CSV files using Polars for efficient processing
- Groups products and variants
- Transforms CSV data to Firestore documents
- Handles batch operations for optimal performance
- Supports selective updates and dry-run mode

See `import-products-polars.md` for complete documentation.

### seed-firestore.sh

An orchestration script that:
- Starts the emulator in the background
- Waits for the emulator to be ready
- Runs the import script
- Verifies the imported data
- Stops the emulator (triggering export)

## Script Options

### Emulator Start Options

```bash
npx firebase emulators:start \
  --only firestore \                    # Start only Firestore emulator
  --import=./emulator-data \            # Import existing data on start
  --export-on-exit=./emulator-data      # Export data when stopping
```

### Import Script Options

```bash
# Dry run (preview without importing)
FIRESTORE_EMULATOR_HOST=localhost:8080 \
  node --experimental-strip-types import-products-polars.ts \
  --csv sample-products.csv \
  --dry-run

# Import specific products only
FIRESTORE_EMULATOR_HOST=localhost:8080 \
  node --experimental-strip-types import-products-polars.ts \
  --csv sample-products.csv \
  --product-ids "test-product-001,test-product-002"

# Update only specific fields
FIRESTORE_EMULATOR_HOST=localhost:8080 \
  node --experimental-strip-types import-products-polars.ts \
  --csv sample-products.csv \
  --update-fields "variants,description"

# Import a sample of products
FIRESTORE_EMULATOR_HOST=localhost:8080 \
  node --experimental-strip-types import-products-polars.ts \
  --csv sample-products.csv \
  --sample 5
```

## Data Flow

1. **CSV Reading**: The script reads `sample-products.csv` using Polars
2. **Data Transformation**: CSV rows are grouped by Product ID and transformed to Firestore documents
3. **Emulator Connection**: Script connects to Firestore emulator via `FIRESTORE_EMULATOR_HOST`
4. **Batch Operations**: Products are added/updated using optimized batch writes
5. **Data Verification**: Script or manual verification confirms successful import
6. **Data Export**: When emulator stops, data is exported to `./emulator-data`

## Troubleshooting

### Emulator Port Already in Use

```bash
# Check what's using port 8080
lsof -i :8080

# Kill the process or use a different port
```

### Java Version Error

Firebase emulator requires Java 21 or higher:

```bash
# Check Java version
java -version

# Install Java 21
sudo apt-get install openjdk-21-jdk

# Set as default
sudo update-alternatives --set java /usr/lib/jvm/java-21-openjdk-amd64/bin/java
```

### Import Script Can't Connect

Make sure:
1. Emulator is running
2. `FIRESTORE_EMULATOR_HOST` environment variable is set
3. Port 8080 is accessible

```bash
# Test emulator connectivity
curl http://localhost:8080
```

### CSV Format Errors

Ensure your CSV has the required columns:
- `Product ID`
- `Category`
- `Product name`

See `import-products-polars.md` for complete CSV format documentation.

## Production Use

⚠️ **Warning**: The examples above use the emulator. For production:

1. Remove `FIRESTORE_EMULATOR_HOST` environment variable
2. Authenticate with Firebase:
   ```bash
   npx firebase login
   ```
3. Set your project:
   ```bash
   npx firebase use your-project-id
   ```
4. Run with `--production` flag:
   ```bash
   node --experimental-strip-types import-products-polars.ts \
     --csv sample-products.csv \
     --production
   ```

## Files and Directories

- `firebase.json` - Firebase configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore index definitions
- `import-products-polars.ts` - Product import script
- `import-products-polars.md` - Detailed script documentation
- `sample-products.csv` - Sample product data
- `seed-firestore.sh` - Automated seeding script
- `package.json` - Node.js dependencies and npm scripts
- `.gitignore` - Git ignore rules (excludes node_modules, emulator-data, etc.)
- `emulator-data/` - Exported emulator data (created after first run)

## Next Steps

1. Customize `sample-products.csv` with your product data
2. Run the seeding script to populate Firestore
3. Verify the data in Firestore Emulator UI
4. Use the exported data for development/testing
5. Adapt for production use when ready

## Additional Resources

- [Firebase Emulator Documentation](https://firebase.google.com/docs/emulator-suite)
- [Firestore Admin SDK](https://firebase.google.com/docs/firestore/extend-with-functions)
- [import-products-polars.md](./import-products-polars.md) - Complete import script documentation
- [CSV Format Guide](./import-products-polars.md#csv-format-requirements)
