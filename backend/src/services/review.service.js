import mongoose from "mongoose";

import Review from "../models/review.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
};

const validateId = (value, fieldName) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw createError(`Invalid ${fieldName}`, 400);
  }

  return id;
};

const validateRating = (rating) => {
  const value = Number(rating);

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw createError(
      "Rating must be an integer between 1 and 5",
      400
    );
  }

  return value;
};

const validateComment = (comment) => {
  if (typeof comment !== "string" || !comment.trim()) {
    throw createError("Comment is required", 400);
  }

  const value = comment.trim();

  if (value.length > 1000) {
    throw createError(
      "Comment must not exceed 1000 characters",
      400
    );
  }

  return value;
};

const ensureDatabase = (database) => {
  if (!database) {
    throw createError(
      "Database connection is required",
      500
    );
  }

  return database;
};

const ensureProductExists = async (
  productId,
  database
) => {
  const db = ensureDatabase(database);

  const product = await db.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    throw createError("Product not found", 404);
  }

  return product;
};

const listReviews = async (
  productIdInput,
  database
) => {
  const productId = validateId(
    productIdInput,
    "product ID"
  );

  await ensureProductExists(productId, database);

  const reviews = await Review.find({
    productId,
  })
    .sort({
      createdAt: -1,
    })
    .lean();

  const ratings = reviews.map(
    (review) => review.rating
  );

  const averageRating =
    ratings.length > 0
      ? Number(
          (
            ratings.reduce(
              (sum, rating) => sum + rating,
              0
            ) / ratings.length
          ).toFixed(2)
        )
      : 0;

  return {
    reviews,
    count: reviews.length,
    averageRating,
  };
};

const createReview = async (
  productIdInput,
  userIdInput,
  data,
  database
) => {
  const productId = validateId(
    productIdInput,
    "product ID"
  );

  const userId = validateId(
    userIdInput,
    "user ID"
  );

  await ensureProductExists(
    productId,
    database
  );

  const rating = validateRating(
    data?.rating
  );

  const comment = validateComment(
    data?.comment
  );

  const existingReview = await Review.findOne({
    productId,
    userId,
  });

  if (existingReview) {
    throw createError(
      "You have already reviewed this product",
      409
    );
  }

  try {
    const review = await Review.create({
      productId,
      userId,
      rating,
      comment,
    });

    return review.toObject();
  } catch (error) {
    if (error?.code === 11000) {
      throw createError(
        "You have already reviewed this product",
        409
      );
    }

    throw error;
  }
};

const deleteReview = async (
  reviewId,
  userIdInput
) => {
  if (!mongoose.isValidObjectId(reviewId)) {
    throw createError(
      "Invalid review ID",
      400
    );
  }

  const userId = validateId(
    userIdInput,
    "user ID"
  );

  const review = await Review.findById(
    reviewId
  );

  if (!review) {
    throw createError(
      "Review not found",
      404
    );
  }

  if (review.userId !== userId) {
    throw createError(
      "You are not allowed to delete this review",
      403
    );
  }

  await Review.deleteOne({
    _id: reviewId,
  });

  return {
    message: "Review deleted successfully",
  };
};

export default {
  listReviews,
  createReview,
  deleteReview,
};