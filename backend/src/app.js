import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import productImageRoutes from "./routes/productImage.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import activityLogRoutes from "./routes/activityLog.routes.js";
import statisticsRoutes from "./routes/statistics.routes.js";

import { useTestDatabase } from "./middlewares/test-database.middleware.js";
import activityLogger from "./middlewares/activityLogger.middleware.js";

const app = express();

/* =========================
   Proxy
========================= */

app.set("trust proxy", 1);

/* =========================
   Security - Helmet
========================= */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/* =========================
   CORS
========================= */

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedVercelFrontend = (origin) => {
  try {
    const url = new URL(origin);

    if (url.protocol !== "https:") {
      return false;
    }

    if (url.hostname === "eyouth-30805222701069-shop-sphere-frontend-fvsoogug6.vercel.app") {
      return true;
    }

    return /^eyouth-30805222701069-shop-sphere-frontend-[a-z0-9]+\.vercel\.app$/i.test(
      url.hostname
    );
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header.
      // This includes health checks, curl, Postman,
      // server-to-server requests, etc.
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        isAllowedVercelFrontend(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS origin not allowed")
      );
    },
    credentials: true,
  })
);

/* =========================
   Rate Limiting
========================= */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

/* =========================
   Body Parsers
========================= */

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

/* =========================
   Static Files
========================= */

app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

/* =========================
   Activity Logger
========================= */

app.use(activityLogger);

/* =========================
   Test Database
========================= */

if (process.env.NODE_ENV === "test") {
  app.use(useTestDatabase);
}

/* =========================
   Health Check
========================= */

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "API is healthy",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "API is healthy",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   Root
========================= */

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "ShopSphere Backend API",
    message: "ShopSphere API is running",
  });
});

/* =========================
   API Routes
========================= */

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use(
  "/api/product-images",
  productImageRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/reviews", reviewRoutes);

app.use(
  "/api/activity-logs",
  activityLogRoutes
);

app.use(
  "/api/statistics",
  statisticsRoutes
);

/* =========================
   404
========================= */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* =========================
   Global Error Handler
========================= */

app.use((err, req, res, next) => {
  console.error(
    "Unhandled error:",
    err
  );

  return res.status(
    err.statusCode || 500
  ).json({
    success: false,
    message:
      err.message ||
      "Internal server error",
  });
});

export default app;