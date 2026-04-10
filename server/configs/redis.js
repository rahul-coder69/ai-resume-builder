import Redis from "ioredis";

let redisClient = null;
let redisUnavailableLogged = false;

const cleanEnv = (value) =>
  String(value || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "");

const redisUrl = cleanEnv(process.env.REDIS_URL);
const redisEnabled =
  cleanEnv(process.env.REDIS_ENABLED || "true").toLowerCase() !== "false";

const buildRedisClient = () => {
  if (!redisEnabled || !redisUrl) {
    if (!redisUnavailableLogged) {
      console.warn(
        "⚠️ Redis is not configured. Email idempotency cache is disabled.",
      );
      redisUnavailableLogged = true;
    }
    return null;
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  client.on("error", (error) => {
    console.error("❌ Redis error:", error.message);
  });

  client.on("connect", () => {
    console.log("✅ Redis connected");
  });

  return client;
};

export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = buildRedisClient();
  }

  if (!redisClient) {
    return null;
  }

  if (redisClient.status === "wait") {
    await redisClient.connect();
  }

  return redisClient;
};

export const closeRedisClient = async () => {
  if (!redisClient) {
    return;
  }

  await redisClient.quit();
  redisClient = null;
};
