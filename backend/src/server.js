import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";

import prisma from "./config/prisma.js";
import connectMongoDB from "./config/mongodb.js";

import {
  verifyEmailConnection,
} from "./services/email.service.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    /* =========================
       PostgreSQL / Prisma
    ========================= */

    await prisma.$connect();

    console.log(
      "✅ PostgreSQL Connected Successfully"
    );

    /* =========================
       MongoDB
    ========================= */

    await connectMongoDB();

    console.log(
      "✅ MongoDB Connected Successfully"
    );

    /* =========================
       Email Service
    ========================= */

    try {
      const emailConnected =
        await verifyEmailConnection();

      if (emailConnected) {
        console.log(
          "✅ Email Service Connected Successfully"
        );
      } else {
        console.warn(
          "⚠️ Email service is not configured. Continuing without email verification."
        );
      }
    } catch (emailError) {
      console.warn(
        "⚠️ Email service verification failed:",
        emailError.message
      );
    }

    /* =========================
       HTTP Server
    ========================= */

    app.listen(PORT, () => {
      console.log(
        `🚀 ShopSphere Backend running on port ${PORT}`
      );

      console.log(
        `🌐 API: http://localhost:${PORT}`
      );

      console.log(
        `❤️ Health: http://localhost:${PORT}/health`
      );

      console.log(
        `❤️ API Health: http://localhost:${PORT}/api/health`
      );
    });
  } catch (error) {
    console.error(
      "❌ Failed to start ShopSphere Backend:",
      error
    );

    try {
      await prisma.$disconnect();
    } catch {}

    process.exit(1);
  }
};

startServer();