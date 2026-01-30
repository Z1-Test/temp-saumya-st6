#!/bin/bash

# Script to seed Firestore data using emulator with export-on-exit
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Firebase Firestore Emulator Data Seeding Script          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Firebase CLI not found. Will use npx instead...${NC}"
    FIREBASE_CMD="npx firebase-tools"
else
    FIREBASE_CMD="firebase"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Export directory
EXPORT_DIR="./emulator-data"

echo -e "${GREEN}✓ Prerequisites ready${NC}"
echo ""

# Start Firebase emulator in background with export-on-exit
echo -e "${BLUE}Starting Firebase Firestore emulator...${NC}"
echo -e "${YELLOW}Export directory: ${EXPORT_DIR}${NC}"
echo ""

# Start emulator in background
$FIREBASE_CMD emulators:start --only firestore --export-on-exit="${EXPORT_DIR}" &
EMULATOR_PID=$!

echo -e "${GREEN}✓ Emulator started (PID: ${EMULATOR_PID})${NC}"
echo -e "${YELLOW}Waiting for emulator to be ready...${NC}"

# Wait for emulator to be ready
sleep 10

# Check if emulator is running
if ! kill -0 $EMULATOR_PID 2>/dev/null; then
    echo -e "${RED}✗ Emulator failed to start${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Emulator is ready${NC}"
echo ""

# Set environment variable for emulator
export FIRESTORE_EMULATOR_HOST=localhost:8080

echo -e "${BLUE}Running data seeding script...${NC}"
echo -e "${YELLOW}CSV file: products.csv${NC}"
echo ""

# Run the import script
if node --experimental-strip-types import-products-polars.ts --csv products.csv; then
    echo ""
    echo -e "${GREEN}✓ Data seeding completed successfully${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Data seeding failed${NC}"
    echo ""
    # Stop emulator on failure
    kill $EMULATOR_PID
    exit 1
fi

# Interact with Firestore (optional queries)
echo -e "${BLUE}Firestore is now seeded and running.${NC}"
echo -e "${YELLOW}You can interact with it at: http://localhost:4000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the emulator and export data...${NC}"
echo ""

# Wait for user interrupt
trap "echo -e '\n${YELLOW}Stopping emulator and exporting data...${NC}'; kill $EMULATOR_PID; wait $EMULATOR_PID 2>/dev/null; echo -e '${GREEN}✓ Emulator stopped and data exported to ${EXPORT_DIR}${NC}'; exit 0" SIGINT SIGTERM

# Keep script running
wait $EMULATOR_PID
