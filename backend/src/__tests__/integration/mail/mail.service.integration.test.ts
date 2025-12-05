import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../../../mail/mail.service';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Define TestModule with ConfigModule to handle environment variables
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    MailService,
    {
      provide: 'NODEMAILER_TRANSPORTER',
      useFactory: () => {
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
      },
    },
  ],
  exports: [MailService],
})
class TestModule {}

describe('MailService Integration Tests', () => {
  let mailService: MailService;
  let testAccount: nodemailer.TestAccount;
  const testTemplate = 'test-email';
  const testContext = {
    title: 'Test Email',
    header: 'Welcome to AccuBooks',
    name: 'Test User',
    message: 'This is a test email sent from the MailService integration tests.',
    buttonText: 'Go to Dashboard',
    buttonUrl: 'https://app.accubooks.test/dashboard',
    year: new Date().getFullYear()
  };
  
  // Create a test module with the MailService
  let module: TestingModule;

  beforeAll(async () => {
    try {
      // Create a test account using ethereal.email
      testAccount = await nodemailer.createTestAccount();
      
      // Set up environment variables for the test
      process.env.SMTP_HOST = testAccount.smtp.host;
      process.env.SMTP_PORT = testAccount.smtp.port.toString();
      process.env.SMTP_SECURE = testAccount.smtp.secure.toString();
      process.env.SMTP_USER = testAccount.user;
      process.env.SMTP_PASS = testAccount.pass;
      process.env.SMTP_FROM = 'test@accubooks.test';
      
      // Create the templates directory if it doesn't exist
      const templatesDir = path.join(__dirname, '../../../mail/templates');
      if (!fs.existsSync(templatesDir)) {
        await promisify(fs.mkdir)(templatesDir, { recursive: true });
      }
      
      // Create a test template
      const testTemplateContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>{{title}}</title>
        </head>
        <body>
            <h1>{{header}}</h1>
            <p>Hello {{name}},</p>
            <p>{{message}}</p>
            {{#if buttonText}}
            <a href="{{buttonUrl}}">{{buttonText}}</a>
            {{/if}}
            <p>© {{year}} AccuBooks</p>
        </body>
        </html>
      `;
      
      await promisify(fs.writeFile)(
        path.join(templatesDir, `${testTemplate}.hbs`),
        testTemplateContent,
        'utf8'
      );
      
      // Initialize the testing module
      module = await Test.createTestingModule({
        imports: [TestModule],
      }).compile();

      // Get the MailService instance from the testing module
      mailService = module.get<MailService>(MailService);
      
      // Add a small delay to ensure the test account is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  });

  describe('sendMail', () => {
    it('should send an email with template successfully', async () => {
      // Arrange
      const testRecipient = 'test@example.com';
      const testSubject = 'Test Email';
      
      // Act
      await mailService.sendMail(
        testRecipient,
        testSubject,
        testTemplate,
        testContext
      );
      
      // Add a small delay to ensure the email is processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a test transport to check for sent messages
      const testTransport = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      // Get the list of messages in the test account
      const messages = await testTransport.getTestMessageUrl({});
      
      // Assert
      expect(messages).toBeDefined();
      expect(messages).toContain('ethereal.email');
    }, 10000); // Increase timeout to 10 seconds for this test
    
    it('should throw an error for invalid template', async () => {
      // Act & Assert
      await expect(
        mailService.sendMail(
          'test@example.com',
          'Test Email',
          'non-existent-template',
          testContext
        )
      ).rejects.toThrow();
    });
    
    it('should handle template compilation errors', async () => {
      // Arrange - Create a bad template
      const badTemplate = 'bad-template';
      const templatesDir = path.join(__dirname, '../../../mail/templates');
      await promisify(fs.writeFile)(
        path.join(templatesDir, `${badTemplate}.hbs`),
        '{{#each invalid}}', // Invalid handlebars syntax
        'utf8'
      );
      
      // Act & Assert
      await expect(
        mailService.sendMail(
          'test@example.com',
          'Test Email',
          badTemplate,
          testContext
        )
      ).rejects.toThrow();
    });

    it('should throw an error for invalid template', async () => {
      // Act & Assert
      await expect(
        mailService.sendMail(
          'test@example.com',
          'Test Email',
          'non-existent-template',
          testContext
        )
      ).rejects.toThrow();
    });

    it('should handle template compilation errors', async () => {
      // Arrange - Create a bad template
      const badTemplate = 'bad-template';
      const templatesDir = path.join(__dirname, '../../../templates');
      await promisify(fs.writeFile)(
        path.join(templatesDir, `${badTemplate}.hbs`),
        '{{#each invalid}}', // Invalid handlebars syntax
        'utf8'
      );

      // Act & Assert
      await expect(
        mailService.sendMail(
          'test@example.com',
          'Test Email',
          badTemplate,
          testContext
        )
      ).rejects.toThrow();
    });
  });

  describe('compileTemplate', () => {
    it('should compile template with context', () => {
      // This is a white-box test since compileTemplate is private
      // We'll access it through the sendMail method
      const result = (mailService as any).compileTemplate(testTemplate, testContext);
      
      // Verify the template was compiled correctly
      expect(result).toContain(testContext.header);
      expect(result).toContain(testContext.name);
      expect(result).toContain(testContext.message);
      expect(result).toContain(testContext.buttonText);
      expect(result).toContain(testContext.buttonUrl);
      expect(result).toContain(testContext.year.toString());
    });
  });

  afterAll(async () => {
    try {
      // Clean up test files
      const templatesDir = path.join(__dirname, '../../../mail/templates');
      const testTemplatePath = path.join(templatesDir, `${testTemplate}.hbs`);
      const badTemplatePath = path.join(templatesDir, 'bad-template.hbs');
      
      // Delete test template file if it exists
      if (fs.existsSync(testTemplatePath)) {
        await promisify(fs.unlink)(testTemplatePath).catch(console.error);
      }
      
      // Delete bad template file if it exists
      if (fs.existsSync(badTemplatePath)) {
        await promisify(fs.unlink)(badTemplatePath).catch(console.error);
      }
      
      // Remove templates directory if empty
      try {
        const files = await promisify(fs.readdir)(templatesDir);
        if (files.length === 0) {
          await promisify(fs.rmdir)(templatesDir).catch(console.error);
        }
      } catch (error) {
        // Directory might not exist, which is fine
        if (error.code !== 'ENOENT') {
          console.error('Error reading templates directory:', error);
        }
      }
      
      // Close any open connections
      if (module) {
        await module.close().catch(console.error);
      }
      
      // Add a small delay to ensure all resources are released
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });
});
