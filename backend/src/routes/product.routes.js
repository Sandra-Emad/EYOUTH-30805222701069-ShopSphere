import express from "express";

import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import validate from "../middlewares/validate.middleware.js";

import authenticate, {
  requireRole,
} from "../middlewares/auth.middleware.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Product Routes
|--------------------------------------------------------------------------
*/

// Get products
//
// Supported query parameters:
//
// ?search=iphone
// ?categoryId=1
// ?sortBy=name
// ?sortBy=price
// ?sortOrder=asc
// ?sortOrder=desc
// ?page=1
// ?limit=10
//
// Example:
// /api/products?search=phone&categoryId=1&sortBy=price&sortOrder=asc&page=1&limit=10
router.get(
  "/",
  getProducts
);

// Get single product
router.get(
  "/:id",
  getProduct
);

/*
|--------------------------------------------------------------------------
| Admin Product Routes
|--------------------------------------------------------------------------
*/

// Create product
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createProductSchema),
  createProduct
);

// Update product
router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(updateProductSchema),
  updateProduct
);

// Delete product
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  deleteProduct
);

export default router;