const nodemailer = require('nodemailer');
require('dotenv').config();

async function main() {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const info = await transporter.sendMail({
    from: 'verify@example.com',
    to: 'test@recipient.com',
    subject: 'Ethereal Test Email',
    text: 'Hello from Phase 3 verification (CommonJS)!',
  });

  console.log('Test email sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
}

main().catch(console.error);
