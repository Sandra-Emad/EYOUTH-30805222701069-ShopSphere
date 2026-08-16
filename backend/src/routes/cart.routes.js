import express from "express";

import {
  get,
  add,
  update,
  remove,
  clear,
} from "../controllers/cart.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// All cart routes require authentication
router.use(authMiddleware);

// GET /api/cart
router.get("/", get);

// POST /api/cart/items
router.post("/items", add);

// PATCH /api/cart/items/:productId
router.patch("/items/:productId", update);

// DELETE /api/cart/items/:productId
router.delete("/items/:productId", remove);

// DELETE /api/cart
router.delete("/", clear);

export default router;