import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import reviewRoutes from "./routes/review.routes.js";

import testPrisma from "./config/test-prisma.js";

const app = express();

app.use(cors());

app.use(express.json());

/*
 * Use the test PostgreSQL database
 * for all API requests during tests.
 */
if (process.env.NODE_ENV === "test") {
  app.use((req, res, next) => {
    req.database = testPrisma;
    next();
  });
}

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

/*
 * API Routes
 */
app.use("/api/auth", authRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/reviews", reviewRoutes);

export default app;