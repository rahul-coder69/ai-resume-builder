import mongoose from "mongoose";

const connectDB = async () => {
  let mongodbURI = (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    ""
  ).trim();

  if (!mongodbURI) {
    throw new Error(
      "MONGODB_URI (or MONGO_URI) environment variable is not defined",
    );
  }

  // Remove optional quotes from .env values.
  if (
    (mongodbURI.startsWith('"') && mongodbURI.endsWith('"')) ||
    (mongodbURI.startsWith("'") && mongodbURI.endsWith("'"))
  ) {
    mongodbURI = mongodbURI.slice(1, -1);
  }

  mongoose.connection.on("connected", () => {
    console.log("Database connected successfully");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  await mongoose.connect(mongodbURI, {
    dbName: "resume_builder",
  });
};

export default connectDB;
