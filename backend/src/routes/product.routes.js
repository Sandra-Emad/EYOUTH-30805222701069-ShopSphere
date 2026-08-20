import express from "express";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/product.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validationMiddleware from "../middlewares/validation.middleware.js";

import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "../validators/product.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Get all products
router.get(
  "/",
  validationMiddleware(productQuerySchema, "query"),
  getAll
);

// Get one product
router.get(
  "/:id",
  getOne
);

/*
|--------------------------------------------------------------------------
| Admin Product CRUD
|--------------------------------------------------------------------------
*/

// Create product
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validationMiddleware(createProductSchema, "body"),
  create
);

// Update product
// IMPORTANT: tests use PUT
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validationMiddleware(updateProductSchema, "body"),
  update
);

// Keep PATCH support as well
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validationMiddleware(updateProductSchema, "body"),
  update
);

// Delete product
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  remove
);

export default router;