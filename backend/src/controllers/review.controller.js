import reviewService from "../services/review.service.js";

export const getByProduct = async (req, res) => {
  try {
    const result = await reviewService.listReviews(
      req.params.productId,
      req.database
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get reviews error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to get reviews",
    });
  }
};

export const create = async (req, res) => {
  try {
    const review =
      await reviewService.createReview(
        req.params.productId,
        req.user.userId,
        req.body,
        req.database
      );

    return res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Create review error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to create review",
    });
  }
};

export const update = async (req, res) => {
  try {
    const review = await reviewService.updateReview(
      req.params.reviewId,
      req.user.userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error(
      "Update review error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to update review",
    });
  }
};

export const remove = async (req, res) => {
  try {
    const result =
      await reviewService.deleteReview(
        req.params.id ||
          req.params.reviewId,
        req.user.userId
      );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Delete review error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete review",
    });
  }
};

export const getReviews = getByProduct;
export const addReview = create;
export const deleteReview = remove;