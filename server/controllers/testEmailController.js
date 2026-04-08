import { sendEmail } from "../configs/email.js";

export const testSendEmail = async (req, res) => {
  try {
    const { toEmail } = req.body;

    if (!toEmail) {
      return res.status(400).json({
        message: "Please provide 'toEmail' in request body",
        example: { toEmail: "your-email@ethereal.email" },
      });
    }

    await sendEmail({
      to: toEmail,
      subject: "Resume Builder Test Email ✅",
      text: "This is a test email from your Resume Builder app. If you received this, your SMTP setup is working perfectly!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px;">
          <h2 style="color: #047857;">✅ Email Test Successful!</h2>
          <p>Hi there,</p>
          <p>This test email confirms that your <strong>SMTP configuration is working perfectly</strong>.</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #047857; padding: 15px; margin: 20px 0;">
            <p><strong>Your app can now send:</strong></p>
            <ul>
              <li>✉️ OTP verification emails for signup</li>
              <li>🔑 Password reset emails</li>
              <li>📧 Any other notifications</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            Timestamp: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "Test email sent successfully! Check your Ethereal inbox.",
      etherealInbox: "https://ethereal.email/messages",
      note: "Login to Ethereal to view the email",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to send email",
      error: error.message,
      troubleshooting: [
        "1. Make sure SMTP_HOST, SMTP_USER, SMTP_PASS are correct in .env",
        "2. Restart your server after changing .env",
        "3. Check that you copied credentials exactly from Ethereal",
        "4. Make sure there are no extra spaces in .env values",
      ],
    });
  }
};
