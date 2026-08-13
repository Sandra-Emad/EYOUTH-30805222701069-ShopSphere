import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("", null)
    .optional(),

  price: Joi.number()
    .positive()
    .precision(2)
    .required(),

  stock: Joi.number()
    .integer()
    .min(0)
    .required(),

  imageUrl: Joi.string()
    .uri()
    .allow("", null)
    .optional(),

  categoryId: Joi.number()
    .integer()
    .positive()
    .required(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("", null)
    .optional(),

  price: Joi.number()
    .positive()
    .precision(2)
    .required(),

  stock: Joi.number()
    .integer()
    .min(0)
    .required(),

  imageUrl: Joi.string()
    .uri()
    .allow("", null)
    .optional(),

  categoryId: Joi.number()
    .integer()
    .positive()
    .required(),
});