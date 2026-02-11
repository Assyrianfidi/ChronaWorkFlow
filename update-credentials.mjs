/**
 * AccuBooks Credential Configuration Script
 * Securely prompts for credentials and updates .env.production
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateEnvFile(updates) {
  const envPath = path.join(process.cwd(), '.env.production');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.production not found');
    process.exit(1);
  }
  
  fs.copyFileSync(envPath, envPath + '.bak');
  
  let content = fs.readFileSync(envPath, 'utf8');
  
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
        console.log(`  ✅ Updated ${key}`);
      } else {
        content += `\n${key}=${value}`;
        console.log(`  ✅ Added ${key}`);
      }
    }
  }
  
  fs.writeFileSync(envPath, content);
  console.log('\n✅ .env.production updated successfully');
  console.log('📄 Backup saved to .env.production.bak');
}

async function main() {
  console.log('\n🔐 AccuBooks Credential Configuration');
  console.log('=====================================\n');
  console.log('This script will help you configure credentials.\n');
  console.log('⚠️  NOTE: Input will be visible - paste carefully\n');
  
  const updates = {};
  
  console.log('📦 STRIPE CONFIGURATION (optional, press Enter to skip)');
  console.log('--------------------------------------------------------');
  updates.STRIPE_SECRET_KEY = await question('Stripe Secret Key (sk_live_...): ');
  updates.STRIPE_WEBHOOK_SECRET = await question('Stripe Webhook Secret (whsec_...): ');
  
  console.log('\n☁️  AWS CONFIGURATION (optional, press Enter to skip)');
  console.log('--------------------------------------------------------');
  const awsKeyId = await question('AWS Access Key ID: ');
  if (awsKeyId) {
    updates.AWS_SES_ACCESS_KEY_ID = awsKeyId;
    updates.AWS_SNS_ACCESS_KEY_ID = awsKeyId;
    updates.AWS_CLOUDWATCH_ACCESS_KEY_ID = awsKeyId;
  }
  
  const awsSecret = await question('AWS Secret Access Key: ');
  if (awsSecret) {
    updates.AWS_SES_SECRET_ACCESS_KEY = awsSecret;
    updates.AWS_SNS_SECRET_ACCESS_KEY = awsSecret;
    updates.AWS_CLOUDWATCH_SECRET_ACCESS_KEY = awsSecret;
  }
  
  console.log('\n📧 SENDGRID CONFIGURATION (optional, press Enter to skip)');
  console.log('--------------------------------------------------------');
  updates.SENDGRID_API_KEY = await question('SendGrid API Key (SG...): ');
  
  console.log('\n📱 TWILIO CONFIGURATION (optional, press Enter to skip)');
  console.log('--------------------------------------------------------');
  updates.TWILIO_ACCOUNT_SID = await question('Twilio Account SID: ');
  updates.TWILIO_AUTH_TOKEN = await question('Twilio Auth Token: ');
  
  await updateEnvFile(updates);
  
  console.log('\n🎉 Configuration Complete!');
  console.log('==========================');
  console.log('✅ Credentials saved to .env.production');
  console.log('⚠️  Remember: Never commit this file to git!');
  console.log('\n🚀 Ready to deploy: node server/start-accubooks-prod.js\n');
  
  rl.close();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
