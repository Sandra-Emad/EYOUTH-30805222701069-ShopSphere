import express from "express";

import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validationMiddleware from "../middlewares/validation.middleware.js";

import {
  categoryIdParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getCategories
);

router.get(
  "/:id",
  validationMiddleware(
    categoryIdParamsSchema,
    "params"
  ),
  getCategory
);

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  roleMiddleware("ADMIN"),
  validationMiddleware(createCategorySchema),
  createCategory
);

router.put(
  "/:id",
  authenticate,
  roleMiddleware("ADMIN"),
  validationMiddleware(
    categoryIdParamsSchema,
    "params"
  ),
  validationMiddleware(updateCategorySchema),
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  roleMiddleware("ADMIN"),
  validationMiddleware(
    categoryIdParamsSchema,
    "params"
  ),
  deleteCategory
);

export default router;