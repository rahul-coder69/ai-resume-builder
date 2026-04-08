import express from "express";
import {
  getUserById,
  getUserResumes,
  forgotPassword,
  googleLogin,
  loginUser,
  registerUser,
  resetPassword,
  verifySignupOtp,
  verifyEmailViaToken,
  getEmailVerificationStatus,
  deleteAccount,
} from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/register/verify-otp", verifySignupOtp);
userRouter.post("/login", loginUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/verify-email", verifyEmailViaToken);
userRouter.post("/verify-email/status", getEmailVerificationStatus);
userRouter.post("/google", googleLogin);
userRouter.get("/data", protect, getUserById);
userRouter.get("/resumes", protect, getUserResumes);
userRouter.delete("/delete-account", protect, deleteAccount);

export default userRouter;
