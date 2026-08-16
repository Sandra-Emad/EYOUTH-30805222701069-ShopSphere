import express from "express";

import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/order.controller.js";

import validate from "../middlewares/validate.middleware.js";

import authenticate, {
  requireRole,
} from "../middlewares/auth.middleware.js";

import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Orders
|--------------------------------------------------------------------------
| Customers:
| - Create an order
| - View an order
|
| Admin:
| - View all orders
| - Update order status
| - Delete orders
|--------------------------------------------------------------------------
*/

// Get all orders - ADMIN ONLY
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  getOrders
);

// Get one order - AUTHENTICATED USERS
router.get(
  "/:id",
  authenticate,
  getOrder
);

// Create order - AUTHENTICATED USERS
router.post(
  "/",
  authenticate,
  validate(createOrderSchema),
  createOrder
);

// Update order status - ADMIN ONLY
router.put(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

// Delete order - ADMIN ONLY
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  deleteOrder
);

export default router;