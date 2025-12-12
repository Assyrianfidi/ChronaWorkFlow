import * as nodemailer from "nodemailer";
import * as handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";

export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Nodemailer v7 requires additional options for modern SMTP servers
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private compileTemplate(
    templateName: string,
    data: Record<string, any>,
  ): string {
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      `${templateName}.hbs`,
    );
    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(templateSource);
    return template(data);
  }

  async sendMail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>,
  ): Promise<void> {
    const html = this.compileTemplate(templateName, context);

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
