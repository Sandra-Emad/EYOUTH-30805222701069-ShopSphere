import express from "express";

import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/order.controller.js";

import validate from "../middlewares/validate.middleware.js";

import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";

const router = express.Router();

router.get("/", getOrders);

router.get("/:id", getOrder);

router.post(
  "/",
  validate(createOrderSchema),
  createOrder
);

router.put(
  "/:id/status",
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

router.delete("/:id", deleteOrder);

export default router;