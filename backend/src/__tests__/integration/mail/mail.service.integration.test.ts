import { MailService } from "../../../mail/mail.service";
import nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

var sendMailMock: jest.Mock;

jest.mock("nodemailer", () => {
  sendMailMock = jest.fn();

  return {
    __esModule: true,
    default: {
      createTransport: jest.fn(() => ({
        sendMail: sendMailMock,
      })),
    },
  };
});

describe("MailService Integration Tests", () => {
  let mailService: MailService;
  const testTemplate = "test-email";
  const testContext = {
    title: "Test Email",
    header: "Welcome to AccuBooks",
    name: "Test User",
    message:
      "This is a test email sent from the MailService integration tests.",
    buttonText: "Go to Dashboard",
    buttonUrl: "https://app.accubooks.test/dashboard",
    year: new Date().getFullYear(),
  };

  beforeAll(async () => {
    process.env.SMTP_HOST = "localhost";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_USER = "test";
    process.env.SMTP_PASS = "test";
    process.env.SMTP_FROM = "test@accubooks.test";

    const templatesDir = path.join(__dirname, "../../../mail/templates");
    if (!fs.existsSync(templatesDir)) {
      await promisify(fs.mkdir)(templatesDir, { recursive: true });
    }

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
      "utf8",
    );

    mailService = new MailService();
  });

  beforeEach(() => {
    // resetMocks:true clears implementations; re-apply transport factory per test
    (nodemailer.createTransport as any).mockImplementation(() => ({
      sendMail: sendMailMock,
    }));
  });

  describe("sendMail", () => {
    it("should send an email with template successfully", async () => {
      const testRecipient = "test@example.com";
      const testSubject = "Test Email";

      await mailService.sendMail(
        testRecipient,
        testSubject,
        testTemplate,
        testContext,
      );

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const args = sendMailMock.mock.calls[0][0];
      expect(args.to).toBe(testRecipient);
      expect(args.subject).toBe(testSubject);
      expect(args.from).toBe("test@accubooks.test");
      expect(String(args.html)).toContain(testContext.header);
      expect(String(args.html)).toContain(testContext.name);
    });

    it("should throw an error for invalid template", async () => {
      // Act & Assert
      await expect(
        mailService.sendMail(
          "test@example.com",
          "Test Email",
          "non-existent-template",
          testContext,
        ),
      ).rejects.toThrow();
    });

    it("should handle template compilation errors", async () => {
      // Arrange - Create a bad template
      const badTemplate = "bad-template";
      const templatesDir = path.join(__dirname, "../../../mail/templates");
      await promisify(fs.writeFile)(
        path.join(templatesDir, `${badTemplate}.hbs`),
        "{{#each invalid}}", // Invalid handlebars syntax
        "utf8",
      );

      // Act & Assert
      await expect(
        mailService.sendMail(
          "test@example.com",
          "Test Email",
          badTemplate,
          testContext,
        ),
      ).rejects.toThrow();
    });

  });

  describe("compileTemplate", () => {
    it("should compile template with context", () => {
      // This is a white-box test since compileTemplate is private
      // We'll access it through the sendMail method
      const result = (mailService as any).compileTemplate(
        testTemplate,
        testContext,
      );

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
      const templatesDir = path.join(__dirname, "../../../mail/templates");
      const testTemplatePath = path.join(templatesDir, `${testTemplate}.hbs`);
      const badTemplatePath = path.join(templatesDir, "bad-template.hbs");

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
        const err = error as any;
        if (err?.code !== "ENOENT") {
          console.error("Error reading templates directory:", err);
        }
      }

    } catch (error) {
      console.error("Error during test cleanup:", error);
    }
  });
});

export {};
