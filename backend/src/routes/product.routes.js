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

const router = express.Router();

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