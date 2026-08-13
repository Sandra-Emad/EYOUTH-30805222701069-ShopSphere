import express from "express";

import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import validate from "../middlewares/validate.middleware.js";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";

import { useTestDatabase } from "../middlewares/test-database.middleware.js";

const router = express.Router();

// Use test database for category integration tests
router.use(useTestDatabase);

router.get("/", getCategories);

router.get("/:id", getCategory);

router.post(
  "/",
  validate(createCategorySchema),
  createCategory
);

router.put(
  "/:id",
  validate(updateCategorySchema),
  updateCategory
);

router.delete("/:id", deleteCategory);

export default router;