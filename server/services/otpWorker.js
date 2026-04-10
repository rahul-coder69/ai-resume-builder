import { consumeFromQueue } from "./queuePublisher.js";
import { sendEmail } from "../configs/email.js";

/**
 * Start OTP email worker
 * Consumes messages from "send-otp" queue and sends emails
 */
export const startOtpWorker = async () => {
  try {
    await consumeFromQueue(
      "send-otp",
      async (message) => {
        try {
          const { to, otp, subject, body } = message;

          if (!to || !otp) {
            console.error("❌ Invalid OTP message format:", message);
            return;
          }

          // Build email HTML
          const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px;">
              <h2 style="color: #047857; margin: 0 0 12px 0;">Resume Builder</h2>
              <p>Hello,</p>
              <p>Your One-Time Password (OTP) is:</p>
              <div style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #ecfdf5; color: #047857; font-size: 24px; font-weight: 700; letter-spacing: 4px;">
                ${otp}
              </div>
              <p style="margin-top: 16px;">This code will expire in 10 minutes.</p>
              <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">If you did not request this OTP, please ignore this email.</p>
              <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;" />
              <p style="margin-top: 16px; color: #9ca3af; font-size: 11px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          `;

          // Send email via Gmail SMTP
          const result = await sendEmail({
            to,
            subject,
            text: body,
            html,
          });

          console.log(
            `✅ OTP email sent to ${to}. Message ID: ${result.messageId}`,
          );
        } catch (error) {
          console.error("❌ Error processing OTP message:", error.message);
          throw error; // Re-throw to trigger nack
        }
      },
      {
        prefetch: 5,
        noAck: false,
      },
    );

    console.log("✅ OTP worker started and listening to 'send-otp' queue");
  } catch (error) {
    console.error("❌ Failed to start OTP worker:", error.message);
  }
};
