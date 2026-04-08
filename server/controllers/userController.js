import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Resume from "../models/Resume.js";
import { OAuth2Client } from "google-auth-library";
import { randomInt, randomBytes } from "crypto";
import { sendEmail } from "../configs/email.js";

const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const OTP_EXPIRY_MINUTES = 10;
const GOOGLE_EMAIL_VERIFICATION_TIMEOUT_MS = 5 * 60 * 1000;
const GOOGLE_EMAIL_VERIFICATION_TIMEOUT_SECONDS = Math.floor(
  GOOGLE_EMAIL_VERIFICATION_TIMEOUT_MS / 1000,
);

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const generateOtp = () => String(randomInt(100000, 1000000));

const getOtpExpiryDate = () =>
  new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

const buildSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  authProvider: user.authProvider,
  googleId: user.googleId,
  isEmailVerified: user.isEmailVerified,
});

const sendOtpEmail = async ({ email, otp, name, purpose }) => {
  const displayName = name ? ` ${name}` : "";
  const title =
    purpose === "reset"
      ? "Password reset verification code"
      : "Email verification code";
  const instruction =
    purpose === "reset"
      ? "Use this code to reset your password."
      : "Use this code to verify your email address.";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 12px 0;">Resume Builder</h2>
      <p>Hello${displayName},</p>
      <p>${instruction}</p>
      <div style="display:inline-block;padding:12px 18px;border-radius:10px;background:#ecfdf5;color:#047857;font-size:24px;font-weight:700;letter-spacing:4px;">
        ${otp}
      </div>
      <p style="margin-top:16px;">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      <p style="margin-top:16px;color:#6b7280;font-size:12px;">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  const text = `${title}: ${otp}. This code expires in ${OTP_EXPIRY_MINUTES} minutes.`;

  await sendEmail({
    to: email,
    subject: `${title} - ${otp}`,
    text,
    html,
  });
};

const generateEmailVerificationToken = () => {
  return randomBytes(32).toString("hex");
};

const generateEmailVerificationSyncKey = () => {
  return randomBytes(32).toString("hex");
};

const resolveClientBaseUrl = () => {
  const candidates = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URL1,
    process.env.CLIENT_URL2,
  ];

  const firstValid = candidates
    .map((url) => String(url || "").trim())
    .find(Boolean);

  return (firstValid || "http://localhost:5173").replace(/\/$/, "");
};

const sendEmailVerificationLink = async ({
  email,
  name,
  verificationToken,
}) => {
  const displayName = name ? ` ${name}` : "";
  const verificationLink = `${resolveClientBaseUrl()}/verify-email?token=${verificationToken}`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 12px 0;">Resume Builder</h2>
      <p>Hello${displayName},</p>
      <p>Thank you for signing up with Google! Please verify your email address by clicking the button below:</p>
      <a href="${verificationLink}" style="display:inline-block;padding:12px 24px;margin:20px 0;background:#047857;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
        Verify Email Address
      </a>
      <p style="margin-top:16px;">Or copy and paste this link in your browser:</p>
      <p style="word-break:break-all;color:#047857;font-size:12px;">${verificationLink}</p>
      <p style="margin-top:16px;">This link expires in 5 minutes.</p>
      <p style="margin-top:16px;color:#6b7280;font-size:12px;">If you did not create this account, you can ignore this email.</p>
    </div>
  `;

  const text = `Verify your email: ${verificationLink}`;

  await sendEmail({
    to: email,
    subject: "Verify your Resume Builder email address",
    text,
    html,
  });
};

const getGoogleVerificationRemainingSeconds = (expiresAt) => {
  if (!expiresAt) return 0;

  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
};

// Controller for user registration
// POST: /api/users/register

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Legacy data safety: remove null googleId values that can conflict with unique indexes.
    await User.updateMany({ googleId: null }, { $unset: { googleId: 1 } });

    // Check if required fields are present
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        message: "Required fields are missing",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser?.isEmailVerified) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = getOtpExpiryDate();

    let user = existingUser;
    if (user) {
      user.name = name;
      user.password = hashedPassword;
      user.authProvider = "local";
      user.isEmailVerified = false;
      user.emailVerificationOtpHash = otpHash;
      user.emailVerificationOtpExpiresAt = otpExpiry;
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        authProvider: "local",
        isEmailVerified: false,
        emailVerificationOtpHash: otpHash,
        emailVerificationOtpExpiresAt: otpExpiry,
      });
    }

    await user.save();
    await sendOtpEmail({
      email: normalizedEmail,
      otp,
      name,
      purpose: "verification",
    });

    return res.status(existingUser ? 200 : 201).json({
      message: "Verification OTP sent to your email",
      userId: user._id,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateField = Object.keys(error?.keyPattern || {})[0];

      if (duplicateField === "email") {
        return res.status(400).json({
          message: "User already exists",
        });
      }

      if (duplicateField === "googleId") {
        return res.status(400).json({
          message:
            "Could not create account right now. Please try again once, then continue with OTP verification.",
        });
      }
    }

    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for user login
// POST: /api/users/login

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({
        message: "Invalid Id Please sign up first",
      });
    }

    if (user.authProvider !== "local" || !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google sign-in. Please continue with Google.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid Id Please sign up first",
      });
    }

    // Return success message
    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Logged in",
      token,
      user: buildSafeUser(user),
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for verifying signup OTP
// POST: /api/users/register/verify-otp

export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        message: "Email is already verified",
        token: generateToken(user._id),
        user: buildSafeUser(user),
      });
    }

    if (
      !user.emailVerificationOtpHash ||
      !user.emailVerificationOtpExpiresAt ||
      new Date(user.emailVerificationOtpExpiresAt).getTime() < Date.now()
    ) {
      return res.status(400).json({
        message: "Verification OTP has expired. Please request a new one",
      });
    }

    const isOtpValid = await bcrypt.compare(
      String(otp),
      user.emailVerificationOtpHash,
    );
    if (!isOtpValid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationOtpHash = null;
    user.emailVerificationOtpExpiresAt = null;
    await user.save();

    return res.status(200).json({
      message: "Email verified",
      token: generateToken(user._id),
      user: buildSafeUser(user),
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for sending forgot-password OTP
// POST: /api/users/forgot-password

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (user.authProvider !== "local" || !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google sign-in. Please continue with Google.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before resetting the password",
      });
    }

    const otp = generateOtp();
    user.passwordResetOtpHash = await bcrypt.hash(otp, 10);
    user.passwordResetOtpExpiresAt = getOtpExpiryDate();
    await user.save();

    await sendOtpEmail({
      email: normalizedEmail,
      otp,
      name: user.name,
      purpose: "reset",
    });

    return res.status(200).json({
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for resetting password with OTP
// POST: /api/users/reset-password

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP, and new password are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (user.authProvider !== "local" || !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google sign-in. Please continue with Google.",
      });
    }

    if (
      !user.passwordResetOtpHash ||
      !user.passwordResetOtpExpiresAt ||
      new Date(user.passwordResetOtpExpiresAt).getTime() < Date.now()
    ) {
      return res.status(400).json({
        message: "Reset OTP has expired. Please request a new one",
      });
    }

    const isOtpValid = await bcrypt.compare(
      String(otp),
      user.passwordResetOtpHash,
    );
    if (!isOtpValid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    await user.save();

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for Google login
// POST: /api/users/google

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const googleId = payload?.sub;
    const name = payload?.name || payload?.given_name || email?.split("@")[0];

    if (!email || !googleId) {
      return res.status(400).json({
        message: "Google account verification failed",
      });
    }

    if (payload?.email_verified === false) {
      return res.status(400).json({
        message: "Google email is not verified",
      });
    }

    let user = await User.findOne({ email });

    const verificationToken = generateEmailVerificationToken();
    const verificationSyncKey = generateEmailVerificationSyncKey();
    const tokenExpiry = new Date(
      Date.now() + GOOGLE_EMAIL_VERIFICATION_TIMEOUT_MS,
    );

    if (user) {
      user.googleId = user.googleId || googleId;
      user.authProvider = "google";
      user.isEmailVerified = false;
      user.emailVerificationToken = verificationToken;
      user.emailVerificationTokenExpiresAt = tokenExpiry;
      user.emailVerificationSyncKey = verificationSyncKey;
      user.emailVerificationSyncKeyExpiresAt = tokenExpiry;
      if (!user.name && name) {
        user.name = name;
      }
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password: "",
        authProvider: "google",
        googleId,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: tokenExpiry,
        emailVerificationSyncKey: verificationSyncKey,
        emailVerificationSyncKeyExpiresAt: tokenExpiry,
      });
    }

    // Send verification email
    await sendEmailVerificationLink({
      email,
      name,
      verificationToken,
    });

    user.password = undefined;

    return res.status(200).json({
      message: "Please check your email inbox to verify your email address...",
      token: null,
      verificationSyncKey,
      verificationTimeoutSeconds: GOOGLE_EMAIL_VERIFICATION_TIMEOUT_SECONDS,
      user: buildSafeUser(user),
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for verifying email via token link
// POST: /api/users/verify-email

export const verifyEmailViaToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
    });

    if (!user) {
      return res.status(404).json({
        message: "Invalid verification link. Please request a new one.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        message: "Email is already verified",
        token: generateToken(user._id),
        user: buildSafeUser(user),
      });
    }

    if (
      !user.emailVerificationTokenExpiresAt ||
      new Date(user.emailVerificationTokenExpiresAt).getTime() < Date.now()
    ) {
      return res.status(400).json({
        message: "Verification timeout please try again",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
      token: generateToken(user._id),
      user: buildSafeUser(user),
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for checking email verification status by sync key
// POST: /api/users/verify-email/status

export const getEmailVerificationStatus = async (req, res) => {
  try {
    const { syncKey } = req.body;

    if (!syncKey) {
      return res.status(400).json({
        message: "Sync key is required",
      });
    }

    const user = await User.findOne({
      emailVerificationSyncKey: syncKey,
    });

    if (!user) {
      return res.status(404).json({
        message: "Verification session not found",
      });
    }

    if (
      !user.emailVerificationSyncKeyExpiresAt ||
      new Date(user.emailVerificationSyncKeyExpiresAt).getTime() < Date.now()
    ) {
      return res.status(400).json({
        message: "Verification timeout please try again",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(200).json({
        verified: false,
        remainingSeconds: getGoogleVerificationRemainingSeconds(
          user.emailVerificationSyncKeyExpiresAt,
        ),
      });
    }

    user.emailVerificationSyncKey = null;
    user.emailVerificationSyncKeyExpiresAt = null;
    await user.save();

    return res.status(200).json({
      verified: true,
      message: "Email verified successfully",
      token: generateToken(user._id),
      remainingSeconds: 0,
      user: buildSafeUser(user),
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for getting user by ID
// GET: /api/users/data

export const getUserById = async (req, res) => {
  try {
    const userId = req.userId;

    // Check if user exists
    const user = await User.findById(userId)
      .select("_id name email authProvider googleId isEmailVerified")
      .lean();
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Return user
    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for getting user resumes
// GET: /api/users/resumes

export const getUserResumes = async (req, res) => {
  try {
    const userId = req.userId;

    // Return only list-view fields for faster dashboard load.
    const resumes = await Resume.find({ userId })
      .select("_id title updatedAt accent_color template")
      .sort({ updatedAt: -1 })
      .lean();
    return res.status(200).json({
      resumes,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
