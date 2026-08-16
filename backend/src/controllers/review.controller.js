import reviewService from "../services/review.service.js";

export const getReviews = async (req, res) => {
  try {
    const result = await reviewService.listReviews(
      req.params.productId,
      req.database
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to get reviews",
    });
  }
};

export const addReview = async (req, res) => {
  try {
    const review = await reviewService.createReview(
      req.params.productId,
      req.user.userId,
      req.body,
      req.database
    );

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to add review",
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const result = await reviewService.deleteReview(
      req.params.id,
      req.user.userId
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to delete review",
    });
  }
};
