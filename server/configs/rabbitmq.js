import amqp from "amqplib";

let connection = null;
let channel = null;
let connectInProgress = null;

const cleanEnv = (value) =>
  String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

// Prefer explicit URL, then fallback to individual environment variables.
const buildRabbitMqUrl = () => {
  const explicitUrl = cleanEnv(process.env.RABBITMQ_URL);
  if (explicitUrl) {
    return explicitUrl;
  }

  const host = cleanEnv(process.env.RABBITMQ_HOST);
  const port = cleanEnv(process.env.RABBITMQ_PORT) || "5672";
  const user = cleanEnv(process.env.RABBITMQ_USER) || "guest";
  const pass = cleanEnv(process.env.RABBITMQ_PASS) || "guest";

  if (!host) {
    return null;
  }

  // Construct AMQP URL
  return `amqp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`;
};

const rabbitMqUrl = buildRabbitMqUrl();

const isRabbitMqEnabled = () => {
  const isValid = rabbitMqUrl && /^amqps?:\/\/.+/.test(rabbitMqUrl);
  if (!isValid && rabbitMqUrl) {
    console.warn(
      `⚠️ Invalid RabbitMQ URL format: "${rabbitMqUrl}". Expected amqp:// or amqps://. Email queue disabled.`,
    );
  }
  return isValid;
};

const createConnection = async () => {
  if (!isRabbitMqEnabled()) {
    return null;
  }

  try {
    connection = await amqp.connect(rabbitMqUrl);
    channel = await connection.createChannel();

    connection.on("error", (error) => {
      console.error("❌ RabbitMQ connection error:", error.message);
      connection = null;
      channel = null;
    });

    connection.on("close", () => {
      console.warn("⚠️ RabbitMQ connection closed");
      connection = null;
      channel = null;
    });

    console.log("✅ RabbitMQ connected successfully");
    return { connection, channel };
  } catch (error) {
    console.warn(
      `⚠️ Failed to connect to RabbitMQ at ${rabbitMqUrl}: ${error.message}. Email queue and OTP queue will be disabled.`,
    );
    connection = null;
    channel = null;
    return null;
  }
};

export const getRabbitMqChannel = async () => {
  if (channel) {
    return channel;
  }

  if (!isRabbitMqEnabled()) {
    return null;
  }

  if (!connectInProgress) {
    connectInProgress = createConnection()
      .catch((error) => {
        console.warn(
          `⚠️ RabbitMQ connection failed: ${error.message}. Continuing without queue support.`,
        );
        return null;
      })
      .finally(() => {
        connectInProgress = null;
      });
  }

  await connectInProgress;
  return channel;
};

export const closeRabbitMq = async () => {
  if (channel) {
    await channel.close();
    channel = null;
  }

  if (connection) {
    await connection.close();
    connection = null;
  }
};

export const getRabbitMqStatus = () => ({
  configured: Boolean(rabbitMqUrl),
  connected: Boolean(connection && channel),
});
