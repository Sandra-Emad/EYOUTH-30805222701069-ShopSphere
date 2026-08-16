import express from "express";

import {
  getReviews,
  addReview,
  deleteReview,
} from "../controllers/review.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/products/:productId", getReviews);

router.post(
  "/products/:productId",
  authMiddleware,
  addReview
);

router.delete(
  "/:id",
  authMiddleware,
  deleteReview
);

export default router;
