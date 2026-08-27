import mongoose from "mongoose";
import dns from "node:dns";

let isConnected = false;

const configureDns = () => {
  // Only needed for MongoDB Atlas SRV connections.
  // Local MongoDB does not use SRV DNS.
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
};

const getMongoUrl = () => {
  const isTest =
    process.env.NODE_ENV === "test" ||
    process.env.JEST_WORKER_ID !== undefined;

  if (isTest) {
    return (
      process.env.TEST_MONGODB_URI ||
      process.env.TEST_MONGODB_URL ||
      process.env.MONGODB_TEST_URI ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URI
    );
  }

  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI
  );
};

export const connectMongoDB = async () => {
  if (
    isConnected &&
    mongoose.connection.readyState === 1
  ) {
    return mongoose.connection;
  }

  const mongoUrl = getMongoUrl();

  if (!mongoUrl) {
    throw new Error(
      "MongoDB connection string is not configured"
    );
  }

  if (mongoUrl.startsWith("mongodb+srv://")) {
    configureDns();
  }

  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  isConnected = true;

  return mongoose.connection;
};

export const disconnectMongoDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  isConnected = false;
};

export default connectMongoDB;