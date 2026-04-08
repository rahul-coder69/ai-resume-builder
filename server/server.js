import express from "express";
import cors from "cors";
import compression from "compression";
import "dotenv/config";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import testEmailRouter from "./routes/testEmailRoutes.js";

const app = express();
app.disable("x-powered-by");

const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.CLIENT_URL1,
  process.env.CLIENT_URL2,
  ...(process.env.CLIENT_URL || "").split(","),
]
  .map((origin) => String(origin || "").trim())
  .filter(Boolean);

const configuredOriginRegexes = (process.env.CORS_ALLOWED_ORIGIN_REGEX || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)
  .map((pattern) => {
    try {
      return new RegExp(pattern, "i");
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const hostedOriginRegexes = [
  /^https:\/\/.*\.vercel\.app$/i,
  /^https:\/\/.*\.netlify\.app$/i,
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return [...configuredOriginRegexes, ...hostedOriginRegexes].some((regex) =>
    regex.test(origin),
  );
};

const corsOptions =
  allowedOrigins.length > 0
    ? {
        origin: (origin, callback) => {
          if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
          }
          callback(new Error("Origin not allowed by CORS"));
        },
      }
    : undefined;

app.use(express.json());
app.use(compression({ threshold: 1024 }));
app.use(cors(corsOptions));

app.get("/", (req, res) => res.send("Server is Live!"));
app.use("/api/users", userRouter);
app.use("/api/resumes", resumeRouter);
app.use("/api/ai", aiRouter);
app.use("/api/test", testEmailRouter);

const startServer = async () => {
  try {
    // Database connection
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
