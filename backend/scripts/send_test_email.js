import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    console.log('Creating test account...');
    const testAccount = await nodemailer.createTestAccount();

    console.log('Creating transporter...');
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
    });

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: 'verify@accubooks.test',
      to: 'test@accubooks.test',
      subject: 'AccuBooks Test Email',
      text: 'Hello from AccuBooks Phase 3 verification!',
      html: '<h1>AccuBooks Test Email</h1><p>This is a test email sent during Phase 3 verification.</p>'
    });

    console.log('\n✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending test email:');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:');
  console.error(error);
  process.exit(1);
});
