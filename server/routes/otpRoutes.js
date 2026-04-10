import express from "express";
import { sendOtp, verifyOtp } from "../controllers/otpController.js";

const otpRouter = express.Router();

/**
 * POST /api/otp/send-otp
 * Send OTP to email
 * Body: { email: string }
 */
otpRouter.post("/send-otp", sendOtp);

/**
 * POST /api/otp/verify
 * Verify OTP
 * Body: { email: string, otp: string }
 */
otpRouter.post("/verify", verifyOtp);

export default otpRouter;
