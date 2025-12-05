const fs = require('fs');
const path = require('path');

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '..', 'phase_final_reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Patterns to match common secrets and credentials
const patterns = {
  awsAccessKey: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
  awsSecretKey: /["']?[a-zA-Z0-9/\\+]{40}["']?/g,
  authorization: /[bB]earer\s+[a-zA-Z0-9_\-\.=]+|Basic\s+[a-zA-Z0-9=]+\r?\n/g,
  password: /[pP][aA][sS][sS][wW][oO][rR][dD]\s*[=:;]\s*["']?[^"'\s]+["']?/g,
  secret: /[sS][eE][cC][rR][eE][tT]\s*[=:;]\s*["']?[^"'\s]+["']?/g,
  apiKey: /[aA][pP][iI][-_]?[kK]ey\s*[=:]\s*["']?[a-zA-Z0-9_\-]{20,}["']?/g,
  stripeKey: /(sk|pk)_(test|live)_[0-9a-zA-Z]{24,}/g,
  twilioKey: /SK[0-9a-fA-F]{32}/g,
  githubToken: /[gG][iI][tT][hH][uU][bB].*['"][0-9a-zA-Z]{35,40}['"]/g,
  googleApiKey: /AIza[0-9A-Za-z\\\-_]{30,}/g,
  herokuKey: /[hH][eE][rR][oO][kK][uU].*[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/g
};

// Directories to exclude
const excludeDirs = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'phase_final_reports',
  '.backups',
  'logs'
];

// File extensions to include
const includeExtensions = [
  '.js', '.jsx', '.ts', '.tsx', '.json', '.yaml', '.yml', 
  '.env', '.config.js', '.config.ts', '.conf', '.sh', '.bat',
  '.ps1', '.md', '.txt', 'Dockerfile'
];

// Output file for results
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(reportsDir, `secret_scan_${timestamp}.json`);
const results = [];

console.log('🔍 Starting secret scan...');

// Get all files to scan
function scanDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    const relativePath = path.relative(process.cwd(), fullPath);
    
    // Skip excluded directories
    if (file.isDirectory()) {
      if (!excludeDirs.includes(file.name)) {
        scanDirectory(fullPath);
      }
      continue;
    }
    
    // Check file extension
    const ext = path.extname(file.name).toLowerCase();
    if (!includeExtensions.includes(ext) && !includeExtensions.includes(file.name)) {
      continue;
    }
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      let found = false;
      const fileResults = [];
      
      // Check for each pattern
      for (const [patternName, regex] of Object.entries(patterns)) {
        const matches = content.match(regex) || [];
        
        for (const match of matches) {
          // Skip common false positives
          if (shouldSkipMatch(match)) continue;
          
          // Get line number and context
          const lines = content.split('\n');
          const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
          const context = lines.slice(Math.max(0, lineNumber - 2), lineNumber + 1).join('\n');
          
          fileResults.push({
            pattern: patternName,
            match: match,
            line: lineNumber,
            context: context
          });
          found = true;
        }
      }
      
      if (found) {
        results.push({
          file: relativePath.replace(/\\/g, '/'),
          issues: fileResults
        });
      }
    } catch (error) {
      console.warn(`⚠️  Error processing ${relativePath}:`, error.message);
    }
  }
}

function shouldSkipMatch(match) {
  // Skip common false positives
  const falsePositives = [
    'example',
    'test',
    'dummy',
    'placeholder',
    'changeme',
    'your-',
    'your_'
  ];
  
  const lowerMatch = match.toLowerCase();
  return falsePositives.some(fp => lowerMatch.includes(fp));
}

// Start scanning from the project root
scanDirectory(process.cwd());

// Save results to file
fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');

// Generate a summary
const summary = {
  timestamp: new Date().toISOString(),
  filesScanned: results.reduce((count, file) => count + 1, 0),
  potentialSecretsFound: results.reduce((count, file) => count + file.issues.length, 0),
  reportFile: outputFile
};

console.log('✅ Secret scan complete.');
console.log(`📄 Report saved to: ${outputFile}`);
console.log('📊 Summary:');
console.log(JSON.stringify(summary, null, 2));

// Exit with non-zero code if potential secrets found
process.exit(summary.potentialSecretsFound > 0 ? 1 : 0);
