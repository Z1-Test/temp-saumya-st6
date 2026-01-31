#!/bin/bash

# Script to seed Firestore data using emulator with export-on-exit
# This script:
# 1. Starts Firebase Firestore emulator with --export-on-exit flag
# 2. Runs the import-products-polars script to seed data
# 3. Interacts with Firestore to verify data
# 4. Stops the emulator (which triggers export)

set -e

EMULATOR_PORT=8080
EXPORT_DIR="./emulator-data"

echo "======================================"
echo "Firestore Data Seeding Script"
echo "======================================"
echo ""

# Create export directory if it doesn't exist
mkdir -p "$EXPORT_DIR"

# Start Firebase emulator in the background with export-on-exit
echo "Starting Firebase Firestore emulator on port $EMULATOR_PORT..."
echo "Export directory: $EXPORT_DIR"
npx firebase emulators:start --only firestore --import="$EXPORT_DIR" --export-on-exit="$EXPORT_DIR" &

EMULATOR_PID=$!
echo "Emulator started with PID: $EMULATOR_PID"

# Wait for emulator to be ready
echo "Waiting for emulator to be ready..."
sleep 5

# Check if emulator is running
MAX_RETRIES=30
RETRY_COUNT=0
while ! curl -s http://localhost:$EMULATOR_PORT > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "ERROR: Emulator failed to start after $MAX_RETRIES attempts"
        kill $EMULATOR_PID 2>/dev/null || true
        exit 1
    fi
    echo "Waiting for emulator... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo "✓ Emulator is ready!"
echo ""

# Set environment variable for emulator
export FIRESTORE_EMULATOR_HOST=localhost:$EMULATOR_PORT

# Run the import-products-polars script
echo "======================================"
echo "Importing products from CSV..."
echo "======================================"
node --experimental-strip-types import-products-polars.ts --csv sample-products.csv

echo ""
echo "======================================"
echo "Verifying imported data..."
echo "======================================"

# Create a simple verification script
cat > verify-data.js << 'EOF'
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'demo-project'
});

const db = admin.firestore();

async function verifyData() {
  try {
    console.log('Fetching products from Firestore...\n');
    const snapshot = await db.collection('products').get();
    
    if (snapshot.empty) {
      console.log('⚠ No products found in Firestore');
      return;
    }
    
    console.log(`✓ Found ${snapshot.size} product(s) in Firestore:\n`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- Product ID: ${doc.id}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Category: ${data.category}`);
      console.log(`  Variants: ${data.variants ? data.variants.length : 0}`);
      console.log('');
    });
    
    console.log('✓ Data verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error verifying data:', error);
    process.exit(1);
  }
}

verifyData();
EOF

# Run verification
node verify-data.js

echo ""
echo "======================================"
echo "Stopping emulator (triggering export)..."
echo "======================================"

# Stop the emulator gracefully to trigger export
kill -SIGINT $EMULATOR_PID 2>/dev/null || true

# Wait for emulator to shutdown and export
sleep 5

# Check if export was created
if [ -d "$EXPORT_DIR/firestore_export" ]; then
    echo "✓ Emulator data exported to $EXPORT_DIR"
    ls -lh "$EXPORT_DIR"
else
    echo "⚠ Export directory not found at $EXPORT_DIR/firestore_export"
fi

# Cleanup
rm -f verify-data.js

echo ""
echo "======================================"
echo "✓ Seeding process completed!"
echo "======================================"
echo ""
echo "Summary:"
echo "- Products imported from sample-products.csv"
echo "- Data verified in Firestore emulator"
echo "- Emulator data exported to $EXPORT_DIR"
echo ""
