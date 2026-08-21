import mongoose from "mongoose";

let isConnected = false;

export const connectMongoDB = async () => {
  if (
    isConnected &&
    mongoose.connection.readyState === 1
  ) {
    return mongoose.connection;
  }

  const mongoUrl =
    process.env.TEST_MONGODB_URL ||
    process.env.MONGODB_TEST_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI;

  if (!mongoUrl) {
    throw new Error(
      "MongoDB connection string is not configured"
    );
  }

  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  isConnected = true;

  return mongoose.connection;
};

export const disconnectMongoDB = async () => {
  if (
    mongoose.connection.readyState !== 0
  ) {
    await mongoose.disconnect();
  }

  isConnected = false;
};

export default connectMongoDB;