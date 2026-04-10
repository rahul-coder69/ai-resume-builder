import { randomUUID } from "crypto";
import { getRabbitMqChannel } from "../configs/rabbitmq.js";
import { getRedisClient } from "../configs/redis.js";
import { sendEmail } from "../configs/email.js";

const cleanEnv = (value) =>
  String(value || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "");

const EMAIL_QUEUE = cleanEnv(process.env.EMAIL_QUEUE_NAME || "email.jobs");
const EMAIL_RETRY_QUEUE = cleanEnv(
  process.env.EMAIL_RETRY_QUEUE_NAME || "email.jobs.retry",
);
const EMAIL_PREFETCH = Number(cleanEnv(process.env.EMAIL_QUEUE_PREFETCH) || 10);
const EMAIL_MAX_RETRIES = Number(
  cleanEnv(process.env.EMAIL_QUEUE_MAX_RETRIES) || 5,
);
const EMAIL_RETRY_BASE_DELAY_MS = Number(
  cleanEnv(process.env.EMAIL_QUEUE_RETRY_BASE_DELAY_MS) || 3000,
);
const EMAIL_RETRY_MAX_DELAY_MS = Number(
  cleanEnv(process.env.EMAIL_QUEUE_RETRY_MAX_DELAY_MS) || 120000,
);
const EMAIL_SENT_KEY_TTL_SECONDS = Number(
  cleanEnv(process.env.EMAIL_SENT_KEY_TTL_SECONDS) || 86400,
);

let queuePrepared = false;
let workerStarted = false;

const delayForAttempt = (attempt) => {
  const exponentialDelay =
    EMAIL_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1);
  return Math.min(exponentialDelay, EMAIL_RETRY_MAX_DELAY_MS);
};

const emailSentKey = (jobId) => `email:sent:${jobId}`;

const ensureQueueTopology = async () => {
  if (queuePrepared) {
    return;
  }

  const channel = await getRabbitMqChannel();
  if (!channel) {
    console.warn("⚠️ RabbitMQ not available. Queue topology not prepared.");
    return;
  }

  await channel.assertQueue(EMAIL_QUEUE, {
    durable: true,
  });

  await channel.assertQueue(EMAIL_RETRY_QUEUE, {
    durable: true,
    deadLetterExchange: "",
    deadLetterRoutingKey: EMAIL_QUEUE,
  });

  queuePrepared = true;
};

export const enqueueEmailJob = async (
  { to, subject, text, html, metadata = {} },
  { idempotencyKey } = {},
) => {
  const channel = await getRabbitMqChannel();
  if (!channel) {
    console.error("❌ RabbitMQ not configured. Email job dropped: ", to);
    throw new Error(
      "Email queue not available. Configure RABBITMQ_URL or RABBITMQ_HOST/RABBITMQ_PORT credentials.",
    );
  }

  await ensureQueueTopology();
  const job = {
    id: idempotencyKey || randomUUID(),
    to,
    subject,
    text,
    html,
    metadata,
    queuedAt: new Date().toISOString(),
  };

  const payload = Buffer.from(JSON.stringify(job));

  const published = channel.sendToQueue(EMAIL_QUEUE, payload, {
    persistent: true,
    contentType: "application/json",
    headers: {
      "x-attempt": 0,
    },
  });

  if (!published) {
    throw new Error("Failed to enqueue email job");
  }

  return {
    queued: true,
    jobId: job.id,
  };
};

const processEmailMessage = async (msg) => {
  if (!msg) {
    return;
  }

  const channel = await getRabbitMqChannel();
  if (!channel) {
    console.error("❌ RabbitMQ not available during message processing");
    return;
  }

  try {
    const content = JSON.parse(msg.content.toString("utf-8"));
    const attempt = Number(msg.properties?.headers?.["x-attempt"] || 0);
    const redis = await getRedisClient();

    if (redis) {
      const alreadySent = await redis.get(emailSentKey(content.id));
      if (alreadySent) {
        channel.ack(msg);
        return;
      }
    }

    await sendEmail({
      to: content.to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });

    if (redis) {
      await redis.set(
        emailSentKey(content.id),
        "1",
        "EX",
        EMAIL_SENT_KEY_TTL_SECONDS,
      );
    }

    channel.ack(msg);
  } catch (error) {
    const attempt = Number(msg.properties?.headers?.["x-attempt"] || 0) + 1;

    if (attempt > EMAIL_MAX_RETRIES) {
      console.error("❌ Email job dropped after max retries:", error.message);
      channel.ack(msg);
      return;
    }

    const retryDelayMs = delayForAttempt(attempt);
    const requeued = channel.sendToQueue(EMAIL_RETRY_QUEUE, msg.content, {
      persistent: true,
      contentType: "application/json",
      expiration: String(retryDelayMs),
      headers: {
        "x-attempt": attempt,
      },
    });

    if (!requeued) {
      console.error("❌ Failed to push email job to retry queue");
    }

    channel.ack(msg);
  }
};

export const startEmailWorker = async () => {
  if (workerStarted) {
    return;
  }

  const channel = await getRabbitMqChannel();
  if (!channel) {
    console.warn("⚠️ RabbitMQ not configured. Email queue worker disabled.");
    return;
  }

  await ensureQueueTopology();
  await channel.prefetch(EMAIL_PREFETCH);
  await channel.consume(EMAIL_QUEUE, processEmailMessage, {
    noAck: false,
  });

  workerStarted = true;
  console.log("✅ Email worker started");
};
