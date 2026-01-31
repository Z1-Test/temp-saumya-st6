# Quick Reference: Firebase Firestore Data Seeding

## 🎯 Quick Commands

```bash
# 1. Install dependencies
npm install

# 2. See a demo of the workflow (no emulator needed)
npm run demo

# 3. Run the complete seeding process
npm run seed:data
```

## 📋 What Gets Created

### Files
- `sample-products.csv` - Sample product data for testing
- `seed-firestore-data.js` - Automated seeding script
- `demo-seeding-workflow.js` - Demonstration script
- `SEEDING-GUIDE.md` - Complete documentation

### Directories (after running)
- `node_modules/` - Dependencies (gitignored)
- `firestore-data/` - Exported emulator data (gitignored)

## 🔄 The Workflow

1. **Start Emulator** with `--export-on-exit` flag
2. **Wait** for emulator to be ready
3. **Import** products from CSV using `import-products-polars.ts`
4. **Interact** with Firestore (optional)
5. **Exit** - data is automatically exported

## 💻 Manual Commands

### Start emulator with export on exit:
```bash
npx firebase emulators:start --only firestore --export-on-exit=./firestore-data
```

### In another terminal, run import:
```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
node --experimental-strip-types import-products-polars.ts --csv sample-products.csv
```

### Query the data:
```javascript
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'demo-project' });
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const db = admin.firestore();
const snapshot = await db.collection('products').get();
console.log(`Found ${snapshot.size} products`);
```

## 🎨 CSV Format

Required columns:
- `Product ID` - Unique identifier
- `Category` - Product category (lips, skin, hair)
- `Product name` - Display name

Optional columns:
- Shade Name, Shade Code, Hex Code
- Price (₹), Stock, Quantity
- SKU, Product code
- Description, Short description
- Key benefits, Ingredients
- How to Use, Caution
- And more...

See `import-products-polars.md` for complete format.

## 📦 Sample Data

The included `sample-products.csv` has:
- 2 products
- 3 total records
- 1 product with variants (Premium Matte Lipstick - 2 shades)
- 1 simple product (Hydrating Face Cream)

## 🔍 Test Import (Dry Run)

Preview what will be imported without writing to database:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
node --experimental-strip-types import-products-polars.ts \
  --csv sample-products.csv \
  --dry-run
```

## 📚 More Information

- Full guide: `SEEDING-GUIDE.md`
- Import script docs: `import-products-polars.md`
- Repository README: `README.md`
