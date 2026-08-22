import express from "express";

import {
  create,
  getByProduct,
  update,
  remove,
} from "../controllers/review.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import validationMiddleware from "../middlewares/validation.middleware.js";

import {
  createReviewSchema,
  reviewProductParamsSchema,
  updateReviewSchema,
  reviewIdParamsSchema,
} from "../validators/review.validator.js";

const router = express.Router();

const reviewIdValidation =
  validationMiddleware(
    reviewIdParamsSchema,
    "params"
  );

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

router.get(
  "/products/:productId",
  getByProduct
);

/*
|--------------------------------------------------------------------------
| Authenticated
|--------------------------------------------------------------------------
*/

router.post(
  "/products/:productId",
  authMiddleware,
  validationMiddleware(
    reviewProductParamsSchema,
    "params"
  ),
  validationMiddleware(
    createReviewSchema,
    "body"
  ),
  create
);

/*
 * Backward-compatible singular route.
 */
router.post(
  "/product/:productId",
  authMiddleware,
  validationMiddleware(
    reviewProductParamsSchema,
    "params"
  ),
  validationMiddleware(
    createReviewSchema,
    "body"
  ),
  create
);

router.patch(
  "/:reviewId",
  authMiddleware,
  reviewIdValidation,
  validationMiddleware(
    updateReviewSchema,
    "body"
  ),
  update
);

router.delete(
  "/:reviewId",
  authMiddleware,
  reviewIdValidation,
  remove
);

export default router;