#!/usr/bin/env node

/**
 * Firebase Firestore Data Seeding Script
 * 
 * This script:
 * 1. Starts Firebase emulator with --export-on-exit flag
 * 2. Waits for emulator to be ready
 * 3. Runs the import-products-polars script to seed data
 * 4. Provides interactive prompt to keep emulator running or exit
 * 5. On exit, emulator data is exported automatically
 */

const { spawn } = require('child_process');
const http = require('http');
const readline = require('readline');

// Configuration
const EMULATOR_PORT = 8080;
const EXPORT_DIR = './firestore-data';
const CSV_FILE = './sample-products.csv';
const EMULATOR_HOST = `localhost:${EMULATOR_PORT}`;

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEmulatorReady(retries = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      const req = http.get(`http://${EMULATOR_HOST}`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 400) {
          log('✓ Firestore emulator is ready!', colors.green);
          resolve();
        } else if (attempts < retries) {
          setTimeout(check, delay);
        } else {
          reject(new Error('Emulator did not become ready in time'));
        }
      });

      req.on('error', () => {
        if (attempts < retries) {
          setTimeout(check, delay);
        } else {
          reject(new Error('Emulator did not become ready in time'));
        }
      });
    };

    check();
  });
}

async function runImportScript() {
  return new Promise((resolve, reject) => {
    log('\n📥 Running import-products-polars script...', colors.cyan);
    
    const importProcess = spawn('node', [
      '--experimental-strip-types',
      'import-products-polars.ts',
      '--csv',
      CSV_FILE
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: EMULATOR_HOST
      }
    });

    importProcess.on('close', (code) => {
      if (code === 0) {
        log('\n✓ Data import completed successfully!', colors.green);
        resolve();
      } else {
        reject(new Error(`Import script failed with code ${code}`));
      }
    });

    importProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function promptUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    log('\n' + '='.repeat(70), colors.blue);
    log('Data seeding complete! The emulator is still running.', colors.green);
    log('You can now interact with Firestore at: http://' + EMULATOR_HOST, colors.cyan);
    log('='.repeat(70) + '\n', colors.blue);
    
    rl.question('Press Enter to stop the emulator (data will be exported)...', () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  let emulatorProcess = null;

  try {
    log('\n🚀 Starting Firebase Firestore Data Seeding Process...', colors.blue);
    log('='.repeat(70) + '\n', colors.blue);

    // Step 1: Start Firebase emulator with export-on-exit
    log('1️⃣  Starting Firebase emulator with --export-on-exit flag...', colors.yellow);
    log(`   Export directory: ${EXPORT_DIR}`, colors.cyan);
    
    emulatorProcess = spawn('firebase', [
      'emulators:start',
      '--only',
      'firestore',
      `--export-on-exit=${EXPORT_DIR}`
    ], {
      stdio: 'pipe'
    });

    // Pipe emulator output
    emulatorProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    emulatorProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    // Step 2: Wait for emulator to be ready
    log('\n2️⃣  Waiting for emulator to be ready...', colors.yellow);
    await checkEmulatorReady();

    // Step 3: Run import script
    log('\n3️⃣  Seeding data from CSV file...', colors.yellow);
    await runImportScript();

    // Step 4: Interactive session
    log('\n4️⃣  Emulator ready for interaction...', colors.yellow);
    await promptUser();

    // Step 5: Cleanup
    log('\n5️⃣  Shutting down emulator...', colors.yellow);
    log('   Data will be exported to: ' + EXPORT_DIR, colors.cyan);
    
    // Send SIGINT to gracefully shutdown emulator (triggers export)
    emulatorProcess.kill('SIGINT');
    
    // Wait a bit for export to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    log('\n✓ Process completed successfully!', colors.green);
    log('   Emulator data has been exported to: ' + EXPORT_DIR, colors.cyan);
    
  } catch (error) {
    log('\n✗ Error: ' + error.message, colors.red);
    if (emulatorProcess) {
      emulatorProcess.kill('SIGINT');
    }
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n⚠️  Received interrupt signal. Shutting down...', colors.yellow);
  process.exit(0);
});

main();
