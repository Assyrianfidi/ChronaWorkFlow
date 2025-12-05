// Secret Rotation Script
// This script helps rotate and manage secrets in the AccuBooks application

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class SecretRotator {
  constructor() {
    this.rootDir = process.cwd();
    this.backupDir = path.join(this.rootDir, '.backups', `secrets_${new Date().toISOString()}`);
    this.secretsFile = path.join(this.rootDir, '.env');
    this.secretsBackup = path.join(this.backupDir, 'env.backup');
    this.rotationLog = path.join(this.backupDir, 'rotation.log');
    this.secretPatterns = {
      jwt: /(jwt[_-]?secret|jwt[_-]?key|jwt[_-]?signature)/i,
      api: /(api[_-]?key|access[_-]?token|secret[_-]?key)/i,
      db: /(db[_-]?(pwd|pass|password|secret)|database[_-]?(pwd|pass|password|secret))/i,
      redis: /(redis[_-]?(pwd|pass|password|secret))/i,
      stripe: /(stripe[_-]?(secret|key|api))/i,
      aws: /(aws[_-]?(secret|key|access[_-]?key|secret[_-]?key|session[_-]?token))/i,
      oauth: /(client[_-]?(secret|id)|oauth[_-]?(secret|token|key))/i,
      email: /(smtp[_-]?(pass|password|secret|user|username)|email[_-]?(pass|password|secret|user|username))/i,
      encryption: /(encryption[_-]?(key|secret)|secret[_-]?key|private[_-]?key)/i
    };
  }

  // Create backup directory if it doesn't exist
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.log('Backup directory created');
    }
  }

  // Log messages to file and console
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    // Create log file if it doesn't exist
    if (!fs.existsSync(path.dirname(this.rotationLog))) {
      fs.mkdirSync(path.dirname(this.rotationLog), { recursive: true });
    }
    
    fs.appendFileSync(this.rotationLog, logMessage);
    console.log(`[${timestamp}] ${message}`);
  }

  // Generate a secure random string
  generateSecret(length = 64) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  // Backup current secrets
  backupSecrets() {
    try {
      this.ensureBackupDir();
      
      if (fs.existsSync(this.secretsFile)) {
        const content = fs.readFileSync(this.secretsFile, 'utf8');
        fs.writeFileSync(this.secretsBackup, content);
        this.log(`Secrets backed up to ${this.secretsBackup}`);
        return true;
      }
      
      this.log('No .env file found to back up');
      return false;
    } catch (error) {
      this.log(`Error backing up secrets: ${error.message}`);
      return false;
    }
  }

  // Rotate secrets in .env file
  rotateSecrets() {
    try {
      if (!fs.existsSync(this.secretsFile)) {
        this.log('No .env file found to rotate secrets');
        return false;
      }

      // Create backup first
      if (!this.backupSecrets()) {
        throw new Error('Failed to create backup before rotation');
      }

      let content = fs.readFileSync(this.secretsFile, 'utf8');
      const lines = content.split('\n');
      const rotated = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) {
          continue;
        }

        const match = line.match(/^([^=]+)=(.+)$/);
        if (!match) continue;

        const [_, key, value] = match;
        let newValue = value;
        let rotatedType = null;

        // Check which pattern matches and rotate accordingly
        for (const [type, pattern] of Object.entries(this.secretPatterns)) {
          if (pattern.test(key)) {
            if (type === 'jwt' || type === 'encryption') {
              newValue = this.generateSecret(64);
            } else if (type === 'api' || type === 'stripe' || type === 'aws') {
              newValue = this.generateSecret(40);
            } else if (type === 'db' || type === 'redis' || type === 'email') {
              newValue = this.generateSecret(32);
            } else {
              newValue = this.generateSecret(48);
            }
            rotatedType = type;
            break;
          }
        }

        if (rotatedType) {
          rotated.push({ key, type: rotatedType });
          lines[i] = `${key}=${newValue}`;
          this.log(`Rotated ${rotatedType} secret: ${key}`);
        }
      }

      // Write updated content back to .env
      fs.writeFileSync(this.secretsFile, lines.join('\n'));
      
      // Update .env.example with placeholders
      this.updateEnvExample(rotated);
      
      this.log(`Successfully rotated ${rotated.length} secrets`);
      return true;
    } catch (error) {
      this.log(`Error rotating secrets: ${error.message}`);
      return false;
    }
  }

  // Update .env.example with placeholders for rotated secrets
  updateEnvExample(rotatedSecrets) {
    const examplePath = path.join(this.rootDir, '.env.example');
    let exampleContent = [];
    
    if (fs.existsSync(examplePath)) {
      exampleContent = fs.readFileSync(examplePath, 'utf8').split('\n');
    }
    
    // Update or add placeholders for rotated secrets
    for (const { key, type } of rotatedSecrets) {
      const placeholder = `${key}=YOUR_${key.toUpperCase()}`;
      let found = false;
      
      for (let i = 0; i < exampleContent.length; i++) {
        if (exampleContent[i].startsWith(`${key}=`)) {
          exampleContent[i] = placeholder;
          found = true;
          break;
        }
      }
      
      if (!found) {
        exampleContent.push(placeholder);
      }
    }
    
    fs.writeFileSync(examplePath, exampleContent.join('\n'));
    this.log('Updated .env.example with placeholders for rotated secrets');
  }

  // Main function to run the rotation
  async run() {
    console.log('🚀 Starting secret rotation process...');
    this.ensureBackupDir();
    
    try {
      // Backup current secrets
      this.log('Creating backup of current secrets...');
      if (!this.backupSecrets()) {
        throw new Error('Failed to create backup');
      }
      
      // Rotate secrets
      this.log('Rotating secrets...');
      const success = this.rotateSecrets();
      
      if (success) {
        this.log('✅ Secret rotation completed successfully');
        console.log(`\n🔐 Secret rotation complete!`);
        console.log(`📋 Backup saved to: ${this.backupDir}`);
        console.log(`📝 Log file: ${this.rotationLog}`);
        console.log('\n⚠️  Please update any external services with the new credentials.\n');
      } else {
        throw new Error('Failed to rotate secrets');
      }
    } catch (error) {
      this.log(`❌ Error during secret rotation: ${error.message}`);
      console.error('\n❌ Secret rotation failed!');
      console.error(`📝 Check the log file for details: ${this.rotationLog}`);
      process.exit(1);
    }
  }
}

// Run the rotation if this file is executed directly
if (require.main === module) {
  const rotator = new SecretRotator();
  rotator.run();
}

module.exports = SecretRotator;
