import nodemailer from "nodemailer";

const smtpHost = (process.env.SMTP_HOST || "").trim();
const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").trim();
const smtpFrom = (process.env.SMTP_FROM || "").trim();
const isMailtrapHost = /mailtrap\.io$/i.test(smtpHost);
const resolvedFromAddress = isMailtrapHost ? smtpUser : smtpFrom || smtpUser;

const hasEmailConfig = Boolean(smtpHost && smtpUser && smtpPass);

// Log SMTP configuration status at startup
if (hasEmailConfig) {
  console.log("✅ SMTP Configuration Loaded:");
  console.log("   Host:", smtpHost);
  console.log("   User:", smtpUser);
  console.log("   Port:", process.env.SMTP_PORT || 587);
  console.log("   Secure:", process.env.SMTP_SECURE || "false");
} else {
  console.warn("⚠️ SMTP Not Configured. Email sending will fail.");
  console.warn("   Missing:", {
    SMTP_HOST: !smtpHost,
    SMTP_USER: !smtpUser,
    SMTP_PASS: !smtpPass,
  });
}

const transporter = hasEmailConfig
  ? nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure:
        String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })
  : null;

if (transporter) {
  transporter
    .verify()
    .then(() => {
      console.log("✅ SMTP connection verified successfully");
    })
    .catch((error) => {
      console.error("❌ SMTP connection verify failed:", error.message);
    });
}

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
    );
  }

  try {
    console.log("📧 Sending email to:", to, "from:", resolvedFromAddress);
    const result = await transporter.sendMail({
      from: resolvedFromAddress,
      to,
      subject,
      text,
      html,
    });
    console.log("✅ Email sent successfully. Message ID:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    throw error;
  }
};
