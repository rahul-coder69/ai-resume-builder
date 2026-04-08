import nodemailer from "nodemailer";

const cleanEnv = (value) =>
  String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

const smtpHost = cleanEnv(process.env.SMTP_HOST);
const smtpUser = cleanEnv(process.env.SMTP_USER);
const smtpPass = cleanEnv(process.env.SMTP_PASS);
const smtpFrom = cleanEnv(process.env.SMTP_FROM);
const smtpPort = Number(cleanEnv(process.env.SMTP_PORT) || 587);
const smtpSecure = cleanEnv(process.env.SMTP_SECURE).toLowerCase() === "true";
const isMailtrapHost = /mailtrap\.io$/i.test(smtpHost);
const isValidEmail = (value) => /.+@.+\..+/.test(String(value || ""));
const resolvedFromAddress = isValidEmail(smtpFrom)
  ? smtpFrom
  : isMailtrapHost
    ? "no-reply@mailtrap.dev"
    : smtpUser;

const hasEmailConfig = Boolean(smtpHost && smtpUser && smtpPass);

const buildTransport = (port) => {
  return nodemailer.createTransport({
    host: smtpHost,
    port,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
};

// Log SMTP configuration status at startup
if (hasEmailConfig) {
  console.log("✅ SMTP Configuration Loaded:");
  console.log("   Host:", smtpHost);
  console.log("   User:", smtpUser);
  console.log("   Port:", smtpPort);
  console.log("   Secure:", smtpSecure);
} else {
  console.warn("⚠️ SMTP Not Configured. Email sending will fail.");
  console.warn("   Missing:", {
    SMTP_HOST: !smtpHost,
    SMTP_USER: !smtpUser,
    SMTP_PASS: !smtpPass,
  });
}

const transporter = hasEmailConfig ? buildTransport(smtpPort) : null;

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
    const isTransportError =
      ["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNRESET"].includes(
        error?.code,
      ) || /timed out|connection|socket/i.test(String(error?.message || ""));

    if (isMailtrapHost && isTransportError && smtpPort !== 2525) {
      try {
        console.warn(
          "⚠️ Primary SMTP port failed. Retrying Mailtrap using fallback port 2525...",
        );
        const fallbackTransporter = buildTransport(2525);
        const fallbackResult = await fallbackTransporter.sendMail({
          from: resolvedFromAddress,
          to,
          subject,
          text,
          html,
        });
        console.log(
          "✅ Email sent successfully via fallback port. Message ID:",
          fallbackResult.messageId,
        );
        return fallbackResult;
      } catch (fallbackError) {
        console.error(
          "❌ Email send failed on fallback port:",
          fallbackError.message,
        );
        throw fallbackError;
      }
    }

    console.error("❌ Email send error:", error.message);
    throw error;
  }
};
