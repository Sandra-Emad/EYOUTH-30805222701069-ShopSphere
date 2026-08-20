import express from "express";

import {
  uploadProductImage,
  getProductImages,
  deleteProductImage,
} from "../controllers/productImage.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import validationMiddleware from "../middlewares/validation.middleware.js";

import {
  productImageProductIdParamSchema,
  productImageIdParamSchema,
} from "../validators/productImage.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Get Product Images
|--------------------------------------------------------------------------
| GET /api/product-images/:productId
| Public
|--------------------------------------------------------------------------
*/

router.get(
  "/:productId",
  validationMiddleware(productImageProductIdParamSchema, {
    body: false,
    params: true,
  }),
  getProductImages
);

/*
|--------------------------------------------------------------------------
| Upload Product Image
|--------------------------------------------------------------------------
| POST /api/product-images/:productId
| Admin only
|--------------------------------------------------------------------------
*/

router.post(
  "/:productId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validationMiddleware(productImageProductIdParamSchema, {
    body: false,
    params: true,
  }),
  upload.single("image"),
  uploadProductImage
);

/*
|--------------------------------------------------------------------------
| Delete Product Image
|--------------------------------------------------------------------------
| DELETE /api/product-images/:imageId
| Admin only
|--------------------------------------------------------------------------
*/

router.delete(
  "/:imageId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validationMiddleware(productImageIdParamSchema, {
    body: false,
    params: true,
  }),
  deleteProductImage
);

export default router;