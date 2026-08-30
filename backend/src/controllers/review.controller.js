import {
  getReviewsFromService,
  createReviewInService,
  updateReviewInService,
  deleteReviewInService,
} from "../services/reviewApi.service.js";

import reviewService from "../services/review.service.js";
import prisma from "../config/test-prisma.js";

const isTestEnvironment = () =>
  process.env.NODE_ENV === "test";

const getDatabase = () => prisma;

/* =========================
   GET REVIEWS
========================= */

export const getByProduct = async (req, res) => {
  try {
    const result = isTestEnvironment()
      ? await reviewService.listReviews(
          req.params.productId,
          getDatabase()
        )
      : await getReviewsFromService(
          req.params.productId
        );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get reviews error:",
      error.message
    );

    return res.status(
      error.statusCode || 502
    ).json({
      success: false,
      message:
        error.message ||
        "Review service unavailable",
    });
  }
};

/* =========================
   CREATE REVIEW
========================= */

export const create = async (req, res) => {
  try {
    const result = isTestEnvironment()
      ? await reviewService.createReview(
          req.params.productId,
          req.user.userId,
          req.body,
          getDatabase()
        )
      : await createReviewInService(
          req.params.productId,
          req.user.userId,
          req.body
        );

    if (isTestEnvironment()) {
      return res.status(201).json({
        success: true,
        message: "Review added successfully",
        review: result,
      });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error(
      "Create review error:",
      error.message
    );

    return res.status(
      error.statusCode || 502
    ).json({
      success: false,
      message:
        error.message ||
        "Review service unavailable",
    });
  }
};

/* =========================
   UPDATE REVIEW
========================= */

export const update = async (req, res) => {
  try {
    const result = isTestEnvironment()
      ? await reviewService.updateReview(
          req.params.reviewId,
          req.user.userId,
          req.body
        )
      : await updateReviewInService(
          req.params.reviewId,
          req.user.userId,
          req.body
        );

    if (isTestEnvironment()) {
      return res.status(200).json({
        success: true,
        message: "Review updated successfully",
        review: result,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Update review error:",
      error.message
    );

    return res.status(
      error.statusCode || 502
    ).json({
      success: false,
      message:
        error.message ||
        "Review service unavailable",
    });
  }
};

/* =========================
   DELETE REVIEW
========================= */

export const remove = async (req, res) => {
  try {
    const result = isTestEnvironment()
      ? await reviewService.deleteReview(
          req.params.reviewId,
          req.user.userId
        )
      : await deleteReviewInService(
          req.params.reviewId,
          req.user.userId
        );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Delete review error:",
      error.message
    );

    return res.status(
      error.statusCode || 502
    ).json({
      success: false,
      message:
        error.message ||
        "Review service unavailable",
    });
  }
};

export const getReviews = getByProduct;
export const addReview = create;
export const deleteReview = remove;