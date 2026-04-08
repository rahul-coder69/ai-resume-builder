import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      default: "",
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    // Keep this undefined for local users; null can trigger duplicate-key on unique indexes.
    googleId: { type: String, unique: true, sparse: true },
    emailVerificationOtpHash: { type: String, default: null },
    emailVerificationOtpExpiresAt: { type: Date, default: null },
    passwordResetOtpHash: { type: String, default: null },
    passwordResetOtpExpiresAt: { type: Date, default: null },
    emailVerificationToken: { type: String, default: null },
    emailVerificationTokenExpiresAt: { type: Date, default: null },
    emailVerificationSyncKey: { type: String, default: null },
    emailVerificationSyncKeyExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function (password) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
