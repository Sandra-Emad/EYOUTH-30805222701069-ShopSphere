import {
  getReviewsFromService,
  createReviewInService,
} from "../services/reviewApi.service.js";

export const getByProduct = async (req, res) => {
  try {
    const result =
      await getReviewsFromService(
        req.params.productId
      );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get reviews from review service error:",
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

export const create = async (req, res) => {
  try {
    const result =
      await createReviewInService(
        req.params.productId,
        req.user.userId,
        req.body
      );

    return res.status(201).json(result);
  } catch (error) {
    console.error(
      "Create review through review service error:",
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

/*
 * Review updates/deletes are temporarily kept
 * compatible with the existing API surface.
 * The read/create review flow is now handled
 * by the independent review service.
 */

export const update = async (req, res) => {
  return res.status(501).json({
    success: false,
    message:
      "Review update is handled by the review service.",
  });
};

export const remove = async (req, res) => {
  return res.status(501).json({
    success: false,
    message:
      "Review deletion is handled by the review service.",
  });
};

export const getReviews = getByProduct;
export const addReview = create;
export const deleteReview = remove;
