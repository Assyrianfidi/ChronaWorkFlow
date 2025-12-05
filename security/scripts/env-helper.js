// Environment Configuration Helper
// This script helps manage environment variables and validate configurations

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvHelper {
  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
    this.envExamplePath = path.join(process.cwd(), '.env.example');
    this.requiredVars = [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'CORS_ORIGIN'
    ];
  }

  // Generate a secure random string
  static generateSecret(length = 64) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  // Check if all required environment variables are set
  validate() {
    const missing = [];
    for (const key of this.requiredVars) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
    return {
      isValid: missing.length === 0,
      missingVars: missing
    };
  }

  // Create or update .env file
  async setupEnv() {
    try {
      // Read existing .env file if it exists
      let envContent = '';
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf8');
      }

      // Parse existing variables
      const envVars = {};
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars[match[1].trim()] = match[2].trim();
        }
      });

      // Ensure required variables exist
      for (const key of this.requiredVars) {
        if (!envVars[key]) {
          if (key.endsWith('_SECRET') || key.endsWith('_KEY') || key.endsWith('_PASS')) {
            envVars[key] = `GENERATE_${key}_${Date.now()}`;
          } else if (key === 'NODE_ENV') {
            envVars[key] = 'development';
          } else if (key === 'PORT') {
            envVars[key] = '3001';
          } else if (key === 'CORS_ORIGIN') {
            envVars[key] = 'http://localhost:3000';
          } else {
            envVars[key] = `YOUR_${key}`;
          }
        }
      }

      // Write .env file
      let newEnvContent = '';
      for (const [key, value] of Object.entries(envVars)) {
        newEnvContent += `${key}=${value}\n`;
      }
      
      fs.writeFileSync(this.envPath, newEnvContent.trim());
      
      // Create .env.example with placeholder values
      let exampleEnvContent = '';
      for (const [key, value] of Object.entries(envVars)) {
        if (key.endsWith('_SECRET') || key.endsWith('_KEY') || key.endsWith('_PASS')) {
          exampleEnvContent += `${key}=YOUR_${key}\n`;
        } else {
          exampleEnvContent += `${key}=${value}\n`;
        }
      }
      
      fs.writeFileSync(this.envExamplePath, exampleEnvContent.trim());
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Rotate secrets
  rotateSecrets() {
    try {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      let updated = false;
      
      const newContent = envContent.split('\n').map(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          if (key.endsWith('_SECRET') || key.endsWith('_KEY') || key.endsWith('_PASS')) {
            updated = true;
            return `${key}=${EnvHelper.generateSecret(64)}`;
          }
        }
        return line;
      }).join('\n');
      
      if (updated) {
        fs.writeFileSync(this.envPath, newContent);
        return { success: true, rotated: true };
      }
      
      return { success: true, rotated: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export as CommonJS module
module.exports = new EnvHelper();
