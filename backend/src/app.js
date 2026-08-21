import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import productImageRoutes from "./routes/productImage.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import activityLogRoutes from "./routes/activityLog.routes.js";

import { useTestDatabase } from "./middlewares/test-database.middleware.js";

const app = express();

/* =========================
   Global Middleware
========================= */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   Test Database
========================= */

if (process.env.NODE_ENV === "test") {
  app.use(useTestDatabase);
}

/* =========================
   Health Check
========================= */

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
    message: "E-Commerce API is running",
  });
});

/* =========================
   API Routes
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-images", productImageRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/activity-logs", activityLogRoutes);

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
  console.error("Unhandled error:", err);

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;