// Secure Configuration Manager
// Provides a secure way to manage environment variables and secrets

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

class SecureConfigManager {
  constructor() {
    this.rootDir = process.cwd();
    this.envPath = path.join(this.rootDir, '.env');
    this.envExamplePath = path.join(this.rootDir, '.env.example');
    this.secretsDir = path.join(this.rootDir, 'secrets');
    this.encryptionKey = null;
    this.initialized = false;
  }

  // Initialize the configuration manager
  initialize(encryptionKey = null) {
    // Load environment variables
    if (fs.existsSync(this.envPath)) {
      dotenv.config({ path: this.envPath });
    }

    // Set up encryption key
    this.encryptionKey = encryptionKey || process.env.CONFIG_ENCRYPTION_KEY;
    
    // Ensure secrets directory exists
    if (!fs.existsSync(this.secretsDir)) {
      fs.mkdirSync(this.secretsDir, { recursive: true, mode: 0o700 });
    }

    this.initialized = true;
    return this;
  }

  // Generate a secure encryption key
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Encrypt sensitive data
  encrypt(data) {
    if (!this.initialized) {
      throw new Error('Config manager not initialized. Call initialize() first.');
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not set. Provide a key during initialization.');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      Buffer.from(this.encryptionKey, 'hex'), 
      iv
    );
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted
    };
  }

  // Decrypt sensitive data
  decrypt(encryptedData, iv) {
    if (!this.initialized) {
      throw new Error('Config manager not initialized. Call initialize() first.');
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not set. Provide a key during initialization.');
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Load and decrypt a secret from file
  loadSecret(secretName) {
    const secretPath = path.join(this.secretsDir, `${secretName}.enc`);
    
    if (!fs.existsSync(secretPath)) {
      return null;
    }

    try {
      const { iv, encryptedData } = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
      return this.decrypt(encryptedData, iv);
    } catch (error) {
      console.error(`Error loading secret ${secretName}:`, error.message);
      return null;
    }
  }

  // Save and encrypt a secret to file
  saveSecret(secretName, value) {
    if (!this.initialized) {
      throw new Error('Config manager not initialized. Call initialize() first.');
    }

    const secretPath = path.join(this.secretsDir, `${secretName}.enc`);
    const { iv, encryptedData } = this.encrypt(value);
    
    fs.writeFileSync(
      secretPath,
      JSON.stringify({ iv, encryptedData }, null, 2),
      { mode: 0o600 }
    );
    
    return secretPath;
  }

  // Get a configuration value
  get(key, defaultValue = null) {
    // First try environment variables
    if (process.env[key] !== undefined) {
      return process.env[key];
    }
    
    // Then try to load from secrets
    const secretValue = this.loadSecret(key);
    if (secretValue !== null) {
      return secretValue;
    }
    
    return defaultValue;
  }

  // Set a configuration value (sensitive values should be saved as secrets)
  set(key, value, isSensitive = false) {
    if (isSensitive) {
      this.saveSecret(key, value);
      // Store a reference in .env to indicate the secret is available
      process.env[key] = `file:secrets/${key}.enc`;
      this._updateEnvFile(key, `file:secrets/${key}.enc`);
    } else {
      process.env[key] = value;
      this._updateEnvFile(key, value);
    }
    
    return this;
  }

  // Update the .env file with a new key-value pair
  _updateEnvFile(key, value) {
    let envContent = [];
    let updated = false;
    
    if (fs.existsSync(this.envPath)) {
      envContent = fs.readFileSync(this.envPath, 'utf8').split('\n');
      
      // Check if key already exists
      for (let i = 0; i < envContent.length; i++) {
        if (envContent[i].startsWith(`${key}=`)) {
          envContent[i] = `${key}=${value}`;
          updated = true;
          break;
        }
      }
    }
    
    // If key didn't exist, add it
    if (!updated) {
      envContent.push(`${key}=${value}`);
    }
    
    // Write back to .env file
    fs.writeFileSync(this.envPath, envContent.join('\n'));
    
    // Update .env.example if needed
    this._updateEnvExample(key);
  }

  // Update .env.example with a new key (without the actual value)
  _updateEnvExample(key) {
    let exampleContent = [];
    
    if (fs.existsSync(this.envExamplePath)) {
      exampleContent = fs.readFileSync(this.envExamplePath, 'utf8').split('\n');
      
      // Check if key already exists in example
      for (let i = 0; i < exampleContent.length; i++) {
        if (exampleContent[i].startsWith(`${key}=`)) {
          return; // Already exists, no need to update
        }
      }
    }
    
    // Add the key with a placeholder
    exampleContent.push(`${key}=YOUR_${key.toUpperCase()}`);
    
    // Write back to .env.example
    fs.writeFileSync(this.envExamplePath, exampleContent.join('\n'));
  }

  // Initialize a new project with secure defaults
  static async initializeProject() {
    const configManager = new SecureConfigManager();
    const encryptionKey = configManager.generateEncryptionKey();
    
    // Initialize with the new encryption key
    configManager.initialize(encryptionKey);
    
    // Save the encryption key to a secure location
    const keyPath = path.join(process.env.HOME || process.env.USERPROFILE, '.accubooks', 'encryption.key');
    fs.mkdirSync(path.dirname(keyPath), { recursive: true, mode: 0o700 });
    fs.writeFileSync(keyPath, encryptionKey, { mode: 0o600 });
    
    console.log('🔐 Project initialized with secure configuration');    
    console.log(`🔑 Encryption key saved to: ${keyPath}`);
    console.log('⚠️  IMPORTANT: Back up this key in a secure location!');
    
    return configManager;
  }
}

// Export a singleton instance
let instance = null;

function getConfigManager() {
  if (!instance) {
    instance = new SecureConfigManager();
    // Auto-initialize with environment variables
    instance.initialize(process.env.CONFIG_ENCRYPTION_KEY);
  }
  return instance;
}

// If this file is run directly, initialize a new project
if (require.main === module) {
  SecureConfigManager.initializeProject().catch(error => {
    console.error('❌ Error initializing project:', error.message);
    process.exit(1);
  });
}

module.exports = {
  SecureConfigManager,
  getConfigManager,
  config: getConfigManager()
};
