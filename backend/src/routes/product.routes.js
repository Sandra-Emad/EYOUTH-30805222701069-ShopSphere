import express from "express";

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import validate from "../middlewares/validate.middleware.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validator.js";

import { useTestDatabase } from "../middlewares/test-database.middleware.js";

const router = express.Router();

router.use((req, res, next) => {
  if (process.env.NODE_ENV === "test") {
    return useTestDatabase(req, res, next);
  }

  next();
});

router.get("/", getProducts);

router.get("/:id", getProduct);

router.post(
  "/",
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id",
  validate(updateProductSchema),
  updateProduct
);

router.delete("/:id", deleteProduct);

export default router;