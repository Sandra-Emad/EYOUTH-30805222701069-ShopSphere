import express from "express";

import {
  get,
  add,
  update,
  remove,
  clear,
} from "../controllers/cart.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import validationMiddleware from "../middlewares/validation.middleware.js";

import {
  addToCartSchema,
  updateCartSchema,
  cartProductParamsSchema,
} from "../validators/cart.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Get Cart
|--------------------------------------------------------------------------
*/

router.get("/", get);

/*
|--------------------------------------------------------------------------
| Add Product
|--------------------------------------------------------------------------
*/

router.post(
  "/items",
  validationMiddleware(addToCartSchema),
  add
);

/*
|--------------------------------------------------------------------------
| Update Quantity
|--------------------------------------------------------------------------
*/

router.patch(
  "/items/:productId",
  validationMiddleware(
    cartProductParamsSchema,
    "params"
  ),
  validationMiddleware(updateCartSchema),
  update
);

/*
|--------------------------------------------------------------------------
| Remove Product
|--------------------------------------------------------------------------
*/

router.delete(
  "/items/:productId",
  validationMiddleware(
    cartProductParamsSchema,
    "params"
  ),
  remove
);

/*
|--------------------------------------------------------------------------
| Clear Cart
|--------------------------------------------------------------------------
*/

router.delete("/", clear);

export default router;