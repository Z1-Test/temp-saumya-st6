#!/bin/bash

# Quick test script for emulator and seeding
set -e

echo "=== Starting Firebase Emulator with Export on Exit ==="
echo ""

# Kill any existing emulator processes
pkill -f "firebase emulators:start" 2>/dev/null || true
sleep 2

# Start emulator in background with export-on-exit
echo "Starting emulator (will export to ./emulator-data on exit)..."
npx firebase-tools emulators:start --only firestore --export-on-exit=./emulator-data &
EMULATOR_PID=$!

echo "Emulator PID: $EMULATOR_PID"
echo "Waiting for emulator to be ready (15 seconds)..."
sleep 15

# Set environment variable
export FIRESTORE_EMULATOR_HOST=localhost:8080

# Run the import script
echo ""
echo "=== Seeding Data ==="
echo ""
node --experimental-strip-types import-products-polars.ts --csv products.csv

echo ""
echo "=== Data Seeding Complete ==="
echo ""
echo "Emulator UI: http://localhost:4000"
echo "Firestore endpoint: localhost:8080"
echo ""
echo "Interacting with Firestore... (viewing products)"
echo ""

# Simple interaction - we could query the data here
# For now, just show that we can connect
echo "✓ Emulator is running with seeded data"
echo ""
echo "Press Ctrl+C to stop and export data, or wait 10 seconds for auto-stop..."
echo ""

# Wait a bit for demonstration
sleep 10

# Stop emulator gracefully to trigger export
echo ""
echo "Stopping emulator and exporting data..."
kill -INT $EMULATOR_PID
wait $EMULATOR_PID 2>/dev/null || true

echo ""
echo "✓ Complete! Data exported to ./emulator-data"
echo ""

# Show what was exported
if [ -d "./emulator-data" ]; then
    echo "Exported files:"
    ls -lah ./emulator-data
fi
