import express from "express";
import {
  getEmailStatus,
  testSendEmail,
} from "../controllers/testEmailController.js";

const testEmailRouter = express.Router();

// Check email/queue status
testEmailRouter.get("/email-status", getEmailStatus);

// Test endpoint to verify SMTP setup
testEmailRouter.post("/test-email", testSendEmail);

export default testEmailRouter;
