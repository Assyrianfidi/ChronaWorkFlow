const nodemailer = require('nodemailer');

(async () => {
  try {
    // Create a test account on Ethereal
    const testAccount = await nodemailer.createTestAccount();

    // Create a transporter using the test account
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Send a test email
    const info = await transporter.sendMail({
      from: 'no-reply@accubooks.com',
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email sent using Ethereal.',
      html: '<p>This is a test email sent using <b>Ethereal</b>.</p>',
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending test email:', error);
  }
})();