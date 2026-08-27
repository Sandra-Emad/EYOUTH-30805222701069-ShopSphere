import dotenv from "dotenv";

dotenv.config();

import connectMongoDB from "../src/config/mongodb.js";

let mongoPromise = null;
let appPromise = null;

const loadApp = async () => {
  if (!appPromise) {
    appPromise = import("../src/app.js")
      .then(({ default: app }) => app)
      .catch((error) => {
        appPromise = null;
        throw error;
      });
  }

  return appPromise;
};

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
    const app = await loadApp();

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
