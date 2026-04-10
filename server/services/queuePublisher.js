import { getRabbitMqChannel } from "../configs/rabbitmq.js";

/**
 * Publish a message to a RabbitMQ queue
 * @param {string} queueName - Name of the queue (e.g., "send-otp", "send-email")
 * @param {object} message - Message payload to publish
 * @returns {Promise<boolean>} - true if published, false if RabbitMQ unavailable
 */
export const publishToQueue = async (queueName, message) => {
  try {
    const channel = await getRabbitMqChannel();

    // If RabbitMQ is not configured, return false
    if (!channel) {
      console.warn(
        `⚠️ RabbitMQ not available. Message for queue "${queueName}" was not published.`,
      );
      return false;
    }

    // Declare the queue (idempotent - safe to call multiple times)
    await channel.assertQueue(queueName, {
      durable: true,
    });

    // Publish the message to the queue
    const payload = Buffer.from(JSON.stringify(message));
    const published = channel.sendToQueue(queueName, payload, {
      persistent: true,
      contentType: "application/json",
      timestamp: Date.now(),
    });

    if (published) {
      console.log(`📤 Message published to queue "${queueName}":`, message);
      return true;
    } else {
      console.error(`❌ Failed to publish message to queue "${queueName}"`);
      return false;
    }
  } catch (error) {
    console.error(
      `❌ Error publishing to queue "${queueName}":`,
      error.message,
    );
    return false;
  }
};

/**
 * Consume messages from a RabbitMQ queue
 * @param {string} queueName - Name of the queue to consume from
 * @param {function} handler - Function to handle each message, receives message payload
 * @param {object} options - Consumer options
 * @returns {Promise<void>}
 */
export const consumeFromQueue = async (
  queueName,
  handler,
  options = { prefetch: 1, noAck: false },
) => {
  try {
    const channel = await getRabbitMqChannel();

    if (!channel) {
      console.warn(
        `⚠️ RabbitMQ not available. Queue consumer for "${queueName}" not started.`,
      );
      return;
    }

    // Declare the queue
    await channel.assertQueue(queueName, {
      durable: true,
    });

    // Set prefetch count
    await channel.prefetch(options.prefetch);

    // Consume messages
    await channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString("utf-8"));
        console.log(`📥 Message received from queue "${queueName}":`, content);

        // Call the handler function
        await handler(content, msg);

        // Acknowledge the message
        if (!options.noAck) {
          channel.ack(msg);
        }
      } catch (error) {
        console.error(
          `❌ Error handling message from "${queueName}":`,
          error.message,
        );
        // Nack the message (requeue it)
        channel.nack(msg, false, true);
      }
    });

    console.log(`✅ Consumer started for queue "${queueName}"`);
  } catch (error) {
    console.error(
      `❌ Error starting consumer for queue "${queueName}":`,
      error.message,
    );
  }
};
