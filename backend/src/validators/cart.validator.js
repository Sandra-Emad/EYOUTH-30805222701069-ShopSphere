import Joi from "joi";

export const addToCartSchema = Joi.object({
  productId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "Product ID is required",
      "number.integer":
        "Product ID must be an integer",
      "number.positive":
        "Product ID must be positive",
    }),

  quantity: Joi.number()
    .integer()
    .positive()
    .max(100)
    .required()
    .messages({
      "any.required": "Quantity is required",
      "number.integer":
        "Quantity must be an integer",
      "number.positive":
        "Quantity must be greater than 0",
      "number.max":
        "Quantity cannot exceed 100",
    }),
});

export const updateCartSchema = Joi.object({
  quantity: Joi.number()
    .integer()
    .positive()
    .max(100)
    .required()
    .messages({
      "any.required": "Quantity is required",
      "number.integer":
        "Quantity must be an integer",
      "number.positive":
        "Quantity must be greater than 0",
      "number.max":
        "Quantity cannot exceed 100",
    }),
});

export const cartProductParamsSchema = Joi.object({
  productId: Joi.number()
    .integer()
    .positive()
    .required(),
});