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

const imageIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "Invalid product image ID",
    "number.integer": "Invalid product image ID",
    "number.positive": "Invalid product image ID",
    "any.required": "Invalid product image ID",
  });

export const productImageProductIdParamSchema =
  Joi.object({
    productId: productIdSchema,
  });

export const productImageIdParamSchema =
  Joi.object({
    imageId: imageIdSchema,
  });