import dotenv from "dotenv";

dotenv.config();

import app from "../src/app.js";
import connectMongoDB from "../src/config/mongodb.js";

let mongoPromise = null;

const connectMongo = async () => {
  if (!mongoPromise) {
    mongoPromise = connectMongoDB().catch((error) => {
      mongoPromise = null;
      throw error;
    });
  }

  return mongoPromise;
};

export default async function handler(req, res) {
  try {
    await connectMongo();

    return app(req, res);
  } catch (error) {
    console.error(
      "ShopSphere serverless initialization error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Backend initialization failed",
    });
  }
}