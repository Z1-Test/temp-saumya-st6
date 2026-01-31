# Firestore Data Seeding with Emulator

This guide explains how to seed data into Firebase Firestore using the Firebase emulator with the `--export-on-exit` flag.

## Prerequisites

- Node.js 22+
- npm or yarn
- Firebase CLI (will be installed automatically if not present)

## Quick Start

### Option 1: Using the Shell Script (Recommended)

The easiest way to seed data and run the emulator:

```bash
./seed-firestore.sh
```

This script will:
1. Install Firebase CLI if not present
2. Install npm dependencies if needed
3. Start the Firestore emulator with `--export-on-exit` flag
4. Wait for the emulator to be ready
5. Run the import-products-polars script to seed data
6. Keep the emulator running for interaction
7. Export data to `./emulator-data` when you press Ctrl+C

### Option 2: Manual Steps

If you prefer to run steps manually:

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Start Emulator with Export on Exit

In one terminal:
```bash
firebase emulators:start --only firestore --export-on-exit=./emulator-data
```

Or use the npm script:
```bash
npm run emulator:start
```

#### 3. Seed Data (in another terminal)

```bash
# Set emulator environment variable
export FIRESTORE_EMULATOR_HOST=localhost:8080

# Run the import script
node --experimental-strip-types import-products-polars.ts --csv products.csv
```

Or use the npm script:
```bash
npm run seed:data
```

#### 4. Interact with Firestore

The Firestore emulator UI will be available at: http://localhost:4000

You can view the seeded data, run queries, and test your application.

#### 5. Stop Emulator

Press `Ctrl+C` in the emulator terminal. The data will be automatically exported to `./emulator-data/`.

## Available Scripts

### `npm run emulator:start`
Starts the Firestore emulator with export-on-exit flag pointing to `./emulator-data`

### `npm run seed:data`
Seeds data from `products.csv` to the running emulator

### `npm run seed:dry-run`
Preview what would be imported without actually writing to Firestore

### `./seed-firestore.sh`
All-in-one script that starts emulator, seeds data, and handles cleanup

## CSV Data Format

The `products.csv` file contains sample product data with the following columns:

- **No**: Record number
- **Category**: Product category (lips, eyes, skin, etc.)
- **Product name**: Display name
- **Product ID**: Firestore document ID
- **Product code**: Product code for variant matching
- **SKU**: Stock keeping unit
- **Shade name**: Variant shade name (if applicable)
- **Shade code**: Variant shade code
- **Hex code**: Color hex value
- **Price (₹)**: Product price
- **Stock**: Available quantity
- **Quantity**: Product size/weight
- **Tagline**: Marketing tagline
- **Short description**: Brief description
- **Description**: Full product description
- **Key benefits**: Product benefits (newline-separated)
- **Ingredients**: Product ingredients (comma-separated)
- **How to Use**: Usage instructions
- **Caution**: Safety warnings
- **Shipping and Delivery**: Shipping information
- **Product link**: External product URL

## Customizing the Data

To use your own data:

1. Create or modify `products.csv` with your product data
2. Ensure it follows the column format described above
3. Run the seeding script

## Troubleshooting

### Emulator not starting
```bash
# Check if port 8080 is already in use
lsof -i :8080

# Kill any process using the port
kill -9 <PID>
```

### Dependencies installation fails
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Import script errors
```bash
# Run in dry-run mode first to check for issues
npm run seed:dry-run
```

## Exported Data

When you stop the emulator (Ctrl+C), data is exported to `./emulator-data/`. This includes:

- `firestore_export/`: Firestore data in binary format
- `firebase-export-metadata.json`: Export metadata

You can reuse this exported data by starting the emulator with:

```bash
firebase emulators:start --only firestore --import=./emulator-data --export-on-exit=./emulator-data
```

## Next Steps

After seeding data:

1. Access the Firestore UI at http://localhost:4000
2. View the seeded products in the `products` collection
3. Test your application against the seeded data
4. Export data will be saved when you stop the emulator

## Additional Resources

- [import-products-polars.md](./import-products-polars.md) - Detailed script documentation
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
