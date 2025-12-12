const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");

// Load env (index.js already loads dotenv early, this is safe)
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = (process.env.SMTP_SECURE || "true") === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.FROM_EMAIL ||
  `AccuBooks <${SMTP_USER}>`;

if (!SMTP_USER || !SMTP_PASSWORD) {
  logger.warn(
    "SMTP_USER or SMTP_PASSWORD not set - email sending will fail until configured",
  );
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
  // Use a small pool so we can retry without opening too many connections
  pool: true,
});

async function sendWithRetries(mailOptions, retries = 3) {
  let attempt = 0;
  let lastError;
  while (attempt < retries) {
    try {
      attempt += 1;
      // eslint-disable-next-line no-await-in-loop
      const result = await transporter.sendMail(mailOptions);
      return result;
    } catch (err) {
      lastError = err;
      const backoff = Math.pow(2, attempt) * 100; // exponential backoff ms
      logger.warn(
        `Email send attempt ${attempt} failed. Retrying in ${backoff}ms. Error: ${err.message}`,
      );
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastError;
}

function loadTemplate(templateName) {
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    `${templateName}.hbs`,
  );
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }
  const source = fs.readFileSync(templatePath, "utf8");
  return handlebars.compile(source);
}

function htmlToText(html) {
  // Very small fallback: strip tags for plain-text version
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Send an email using templates located in ../templates
 * @param {string} templateName - handlebars template name (without extension)
 * @param {string|string[]} to - recipient email or array
 * @param {string} subject - subject line
 * @param {object} variables - variables passed to template
 */
async function sendEmail(templateName, to, subject, variables = {}) {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("SMTP_USER or SMTP_PASSWORD not configured in environment");
  }

  const compile = loadTemplate(templateName);
  const html = compile(Object.assign({}, variables));
  const text = variables.plainText || htmlToText(html);

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
  };

  const info = await sendWithRetries(mailOptions, 3);
  logger.info(
    `Email sent: ${info.messageId} to ${Array.isArray(to) ? to.join(",") : to}`,
  );
  return info;
}

module.exports = { sendEmail, transporter };
