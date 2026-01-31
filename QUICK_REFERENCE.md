# Quick Reference: Firestore Data Seeding

## Prerequisites
- Node.js 22+
- Java 21+
- Firebase CLI

## Install Dependencies
```bash
npm install
```

## Commands

### 1. Run Complete Automated Process
```bash
npm run seed-firestore
```

This single command:
- Starts Firebase emulator with `--export-on-exit`
- Imports products from CSV
- Verifies data
- Stops emulator (triggering export)

### 2. Manual Step-by-Step

#### Terminal 1: Start Emulator
```bash
npm run emulator:start
```

Or directly:
```bash
npx firebase emulators:start --only firestore --import=./emulator-data --export-on-exit=./emulator-data
```

#### Terminal 2: Import Products
```bash
npm run import-products
```

Or directly:
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 node --experimental-strip-types import-products-polars.ts --csv sample-products.csv
```

#### Verify Data
Access Firestore Emulator UI:
```
http://localhost:4000
```

#### Stop Emulator
In Terminal 1, press `Ctrl+C` to stop. This triggers the export to `./emulator-data/`.

### 3. View Demo (No Emulator Required)
```bash
npm run demo
```

Shows the complete workflow without actually running the emulator.

## Key Flags Explained

### `--export-on-exit=./emulator-data`
- Automatically exports all Firestore data when emulator stops
- Data saved to `./emulator-data/firestore_export/`
- Includes metadata file: `firebase-export-metadata.json`

### `--import=./emulator-data`
- Imports previously exported data on emulator start
- Useful for persistent development data
- Skipped if directory doesn't exist

### `FIRESTORE_EMULATOR_HOST=localhost:8080`
- Directs Firebase Admin SDK to use emulator
- Required for import script to connect to local emulator
- Without this, script would try to connect to production

## Sample Products

The `sample-products.csv` includes:
- 2 products (Lipstick with 2 shades, Face Cream with 1 variant)
- All required fields (Product ID, Category, Product name)
- Optional fields (descriptions, ingredients, pricing)

## Files Created After First Run

```
emulator-data/
├── firestore_export/
│   ├── firestore_export.overall_export_metadata
│   ├── all_namespaces/
│   │   ├── all_kinds/
│   │   │   └── output-0
│   │   └── all_kinds.export_metadata
│   └── ...
└── firebase-export-metadata.json
```

## Troubleshooting

### Port Already in Use
```bash
lsof -i :8080
# Kill the process using port 8080
```

### Java Version Error
```bash
# Install Java 21
sudo apt-get install openjdk-21-jdk

# Set as default
sudo update-alternatives --set java /usr/lib/jvm/java-21-openjdk-amd64/bin/java
```

### Emulator Download Blocked
If in a CI/network-restricted environment, run the demo instead:
```bash
npm run demo
```

## Documentation

- **SEEDING_GUIDE.md** - Comprehensive guide with detailed explanations
- **import-products-polars.md** - Import script full documentation
- **README.md** - Project overview

## Quick Test

1. Install: `npm install`
2. Demo: `npm run demo`
3. Actual run: `npm run seed-firestore` (requires Java 21+)
