import express from "express";
import { testSendEmail } from "../controllers/testEmailController.js";

const testEmailRouter = express.Router();

// Test endpoint to verify SMTP setup
testEmailRouter.post("/test-email", testSendEmail);

export default testEmailRouter;
