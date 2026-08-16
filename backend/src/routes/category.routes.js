import express from "express";

import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import validate from "../middlewares/validate.middleware.js";

import authenticate, {
  requireRole,
} from "../middlewares/auth.middleware.js";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";

const router = express.Router();

// Public
router.get(
  "/",
  getCategories
);

router.get(
  "/:id",
  getCategory
);

// Admin only
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createCategorySchema),
  createCategory
);

router.put(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(updateCategorySchema),
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  deleteCategory
);

export default router;