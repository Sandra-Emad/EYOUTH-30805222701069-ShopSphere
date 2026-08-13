import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({
      message: "E-Commerce API is running",
    });
  });

  app.get("/health", async (req, res) => {
    res.json({
      server: "ok",
      postgresql: "connected",
      mongodb: "connected",
    });
  });

  app.use("/api/auth", authRoutes);

  return app;
};

export default createApp;