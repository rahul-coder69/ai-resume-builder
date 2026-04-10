import nodemailer from "nodemailer";

const cleanEnv = (value) =>
  String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");

const smtpHost = cleanEnv(process.env.SMTP_HOST);
const smtpUser = cleanEnv(process.env.SMTP_USER || process.env.EMAIL_USER);
const smtpPass = cleanEnv(process.env.SMTP_PASS || process.env.EMAIL_PASS);
const smtpFrom = cleanEnv(process.env.SMTP_FROM);
const smtpPort = Number(cleanEnv(process.env.SMTP_PORT) || 587);
const smtpSecureValue = cleanEnv(process.env.SMTP_SECURE).toLowerCase();
const smtpSecure =
  smtpSecureValue === "true"
    ? true
    : smtpSecureValue === "false"
      ? false
      : smtpPort === 465;
const isValidEmail = (val) => /.+@.+\..+/.test(String(val || ""));
const isGmailHost = /(^|\.)smtp\.gmail\.com$/i.test(smtpHost);
const resolvedFromAddress = isValidEmail(smtpFrom) ? smtpFrom : smtpUser;

const hasEmailConfig = Boolean(smtpHost && smtpUser && smtpPass);
const smtpProvider = isGmailHost ? "gmail" : "custom";

const buildTransport = (port) =>
  nodemailer.createTransport({
    host: smtpHost,
    port,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

if (hasEmailConfig) {
  console.log("✅ SMTP Configuration Loaded:");
  console.log("   Provider:", smtpProvider);
  console.log("   Host:", smtpHost);
  console.log("   User:", smtpUser);
  console.log("   Port:", smtpPort);
  console.log("   Secure:", smtpSecure);
} else {
  console.warn("⚠️ SMTP Not Configured");
}

const transporter = hasEmailConfig ? buildTransport(smtpPort) : null;

if (transporter) {
  transporter
    .verify()
    .then(() => console.log("✅ SMTP verified"))
    .catch((error) => console.error("❌ SMTP verify failed:", error.message));
}

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) throw new Error("SMTP not configured");
  try {
    console.log("📧 Sending to:", to);
    const result = await transporter.sendMail({
      from: resolvedFromAddress,
      to,
      subject,
      text,
      html,
    });
    console.log("✅ Email sent. ID:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ Email error:", error.message);
    throw error;
  }
};

export const getEmailProviderInfo = () => ({
  configured: hasEmailConfig,
  provider: smtpProvider,
  host: smtpHost,
});
