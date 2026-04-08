import nodemailer from "nodemailer";

const smtpHost = (process.env.SMTP_HOST || "").trim();
const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").trim();

const hasEmailConfig = Boolean(smtpHost && smtpUser && smtpPass);

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
    })
  : null;

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
    );
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || smtpUser,
    to,
    subject,
    text,
    html,
  });
};
