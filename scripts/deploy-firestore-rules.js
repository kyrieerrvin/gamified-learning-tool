const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}======================================${colors.reset}`);
console.log(`${colors.cyan}  Deploying Firestore Security Rules  ${colors.reset}`);
console.log(`${colors.cyan}======================================${colors.reset}`);

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log(`${colors.green}✓${colors.reset} Firebase CLI is installed`);
} catch (error) {
  console.error(`${colors.red}✗${colors.reset} Firebase CLI is not installed`);
  console.log(`\nPlease install it with: ${colors.yellow}npm install -g firebase-tools${colors.reset}`);
  console.log(`Then login with: ${colors.yellow}firebase login${colors.reset}`);
  process.exit(1);
}

// Check if rules file exists
const rulesPath = path.resolve(__dirname, '../firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error(`${colors.red}✗${colors.reset} firestore.rules file not found at ${rulesPath}`);
  process.exit(1);
}
console.log(`${colors.green}✓${colors.reset} Found firestore.rules file`);

// Check if firebase.json exists or create it
const firebaseConfigPath = path.resolve(__dirname, '../firebase.json');
let createConfig = false;

if (!fs.existsSync(firebaseConfigPath)) {
  console.log(`${colors.yellow}!${colors.reset} firebase.json not found, creating one...`);
  createConfig = true;
} else {
  console.log(`${colors.green}✓${colors.reset} Found firebase.json`);
}

if (createConfig) {
  const firebaseConfig = {
    firestore: {
      rules: "firestore.rules",
      indexes: "firestore.indexes.json"
    }
  };
  
  fs.writeFileSync(
    firebaseConfigPath, 
    JSON.stringify(firebaseConfig, null, 2)
  );
  
  // Create empty indexes file
  fs.writeFileSync(
    path.resolve(__dirname, '../firestore.indexes.json'),
    JSON.stringify({ indexes: [], fieldOverrides: [] }, null, 2)
  );
  
  console.log(`${colors.green}✓${colors.reset} Created firebase.json and firestore.indexes.json`);
}

// Deploy rules
console.log(`\n${colors.cyan}Deploying rules...${colors.reset}`);

try {
  // Use execSync to run the Firebase deploy command
  execSync('firebase deploy --only firestore:rules', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log(`\n${colors.green}✓${colors.reset} Firestore security rules deployed successfully!`);
} catch (error) {
  console.error(`\n${colors.red}✗${colors.reset} Failed to deploy Firestore rules`);
  console.error(error.message);
  process.exit(1);
}
