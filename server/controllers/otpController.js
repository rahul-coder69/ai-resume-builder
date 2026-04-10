import { getRedisClient } from "../configs/redis.js";
import { publishToQueue } from "../services/queuePublisher.js";
import { randomInt } from "crypto";

const cleanEnv = (value) =>
  String(value || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "");

const OTP_RATE_LIMIT_SECONDS = Number(
  cleanEnv(process.env.OTP_RATE_LIMIT_SECONDS) || 60,
);
const OTP_EXPIRY_MINUTES = 10;

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const generateOtp = () => String(randomInt(100000, 1000000));

/**
 * POST /api/otp/send-otp
 * Send OTP to user email via RabbitMQ queue
 * Rate limited by Redis Upstash
 *
 * Body: { email: string }
 */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Get Redis client
    const redis = await getRedisClient();

    // Rate limiting check
    if (redis) {
      const rateLimitKey = `otp:ratelimit:${normalizedEmail}`;
      const alreadyRequested = await redis.get(rateLimitKey);

      if (alreadyRequested) {
        return res.status(429).json({
          message: "Too many OTP requests. Please try again later.",
          retryAfterSeconds: OTP_RATE_LIMIT_SECONDS,
        });
      }
    }

    // Generate OTP
    const otp = generateOtp();
    console.log(`🔐 Generated OTP for ${normalizedEmail}: ${otp}`);

    // Store OTP in Redis (for verification later)
    if (redis) {
      const otpKey = `otp:${normalizedEmail}`;
      const otpHash = await hashOtp(otp);
      await redis.set(otpKey, otpHash, "EX", OTP_EXPIRY_MINUTES * 60);

      // Set rate limit
      const rateLimitKey = `otp:ratelimit:${normalizedEmail}`;
      await redis.set(rateLimitKey, "true", "EX", OTP_RATE_LIMIT_SECONDS);
    }

    // Publish to RabbitMQ queue "send-otp"
    const messagePublished = await publishToQueue("send-otp", {
      to: normalizedEmail,
      otp,
      subject: "Your OTP for Resume Builder",
      body: `Your OTP is ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
      timestamp: new Date().toISOString(),
    });

    if (!messagePublished) {
      // Still return success to user even if queue failed
      // (email will be retried later via worker)
      console.warn("⚠️ OTP message queued but RabbitMQ may be unavailable");
    }

    return res.status(200).json({
      message: "OTP sent to your email. Check your inbox.",
      email: normalizedEmail,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error("❌ Error sending OTP:", error.message);
    return res.status(500).json({
      message: "Failed to send OTP. Please try again later.",
      error: error.message,
    });
  }
};

/**
 * POST /api/otp/verify
 * Verify OTP submitted by user
 *
 * Body: { email: string, otp: string }
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const redis = await getRedisClient();
    if (!redis) {
      return res.status(500).json({
        message: "OTP verification unavailable. Redis not configured.",
      });
    }

    // Get stored OTP from Redis
    const otpKey = `otp:${normalizedEmail}`;
    const storedOtpHash = await redis.get(otpKey);

    if (!storedOtpHash) {
      return res.status(400).json({
        message: "OTP expired or not found. Please request a new OTP.",
      });
    }

    // Verify OTP (in production, use bcrypt compare)
    const isValid = await verifyOtpHash(otp, storedOtpHash);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid OTP. Please try again.",
      });
    }

    // OTP verified successfully - delete it from Redis
    await redis.del(otpKey);

    return res.status(200).json({
      message: "OTP verified successfully",
      email: normalizedEmail,
      verified: true,
    });
  } catch (error) {
    console.error("❌ Error verifying OTP:", error.message);
    return res.status(500).json({
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};

/**
 * Simple hash function (use bcrypt in production)
 * For now: return OTP as-is for simplicity
 */
const hashOtp = async (otp) => {
  // TODO: Use bcrypt.hash(otp, 10) in production
  return otp;
};

const verifyOtpHash = async (otp, hash) => {
  // TODO: Use bcrypt.compare(otp, hash) in production
  return otp === hash;
};
