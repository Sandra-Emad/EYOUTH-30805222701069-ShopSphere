import Joi from "joi";

const emailSchema = Joi.string()
  .trim()
  .email()
  .required()
  .messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  });

export const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must not exceed 100 characters",
      "any.required": "Name is required",
    }),

  email: emailSchema,

  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password must not exceed 100 characters",
      "any.required": "Password is required",
    }),
});

export const loginSchema = Joi.object({
  email: emailSchema,

  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      "string.empty": "Name cannot be empty",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must not exceed 100 characters",
    }),

  email: Joi.string()
    .trim()
    .email()
    .messages({
      "string.empty": "Email cannot be empty",
      "string.email": "Email must be a valid email address",
    }),

  password: Joi.string()
    .min(8)
    .max(100)
    .messages({
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password must not exceed 100 characters",
    }),
}).min(1);