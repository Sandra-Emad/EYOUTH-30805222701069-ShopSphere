import Joi from "joi";

const productIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "Invalid product ID",
    "number.integer": "Invalid product ID",
    "number.positive": "Invalid product ID",
    "any.required": "Invalid product ID",
  });

const reviewIdSchema = Joi.string()
  .trim()
  .required()
  .messages({
    "string.empty": "Invalid review ID",
    "any.required": "Invalid review ID",
  });

export const reviewProductParamsSchema =
  Joi.object({
    productId: productIdSchema,
  });

export const reviewIdParamsSchema =
  Joi.object({
    reviewId: reviewIdSchema,
  });

export const createReviewSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      "number.base":
        "Rating must be an integer between 1 and 5",
      "number.integer":
        "Rating must be an integer between 1 and 5",
      "number.min":
        "Rating must be an integer between 1 and 5",
      "number.max":
        "Rating must be an integer between 1 and 5",
      "any.required":
        "Rating must be an integer between 1 and 5",
    }),

  comment: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Comment is required",
      "any.required": "Comment is required",
    }),
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .messages({
      "number.base":
        "Rating must be an integer between 1 and 5",
      "number.integer":
        "Rating must be an integer between 1 and 5",
      "number.min":
        "Rating must be an integer between 1 and 5",
      "number.max":
        "Rating must be an integer between 1 and 5",
    }),

  comment: Joi.string()
    .trim()
    .messages({
      "string.empty": "Comment is required",
    }),
}).min(1);