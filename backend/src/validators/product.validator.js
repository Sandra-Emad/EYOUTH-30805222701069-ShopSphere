import Joi from "joi";

/*
|--------------------------------------------------------------------------
| Product ID Params
|--------------------------------------------------------------------------
*/

const productIdSchema = Joi.number()
  .integer()
  .positive()
  .required();

export const productIdParamsSchema = Joi.object({
  id: productIdSchema,
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/*
|--------------------------------------------------------------------------
| Create Product
|--------------------------------------------------------------------------
*/

export const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .required(),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .allow(null)
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
    .trim()
    .uri()
    .allow("")
    .allow(null)
    .optional(),

  categoryId: Joi.number()
    .integer()
    .positive()
    .required(),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/*
|--------------------------------------------------------------------------
| Update Product
|--------------------------------------------------------------------------
*/

export const updateProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .optional(),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .allow(null)
    .optional(),

  price: Joi.number()
    .positive()
    .precision(2)
    .optional(),

  stock: Joi.number()
    .integer()
    .min(0)
    .optional(),

  imageUrl: Joi.string()
    .trim()
    .uri()
    .allow("")
    .allow(null)
    .optional(),

  categoryId: Joi.number()
    .integer()
    .positive()
    .optional(),
})
  .min(1)
  .options({
    abortEarly: false,
    stripUnknown: true,
  });

/*
|--------------------------------------------------------------------------
| Product Query
|--------------------------------------------------------------------------
*/

export const productQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),

  search: Joi.string()
    .trim()
    .max(255)
    .allow("")
    .optional(),

  categoryId: Joi.number()
    .integer()
    .positive()
    .optional(),

  sortBy: Joi.string()
    .valid(
      "name",
      "price",
      "createdAt"
    )
    .default("createdAt"),

  sortOrder: Joi.string()
    .valid("asc", "desc")
    .default("desc"),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/*
|--------------------------------------------------------------------------
| Backward Compatibility Alias
|--------------------------------------------------------------------------
|
| Some existing code may use the singular name.
|
*/

export const productIdParamSchema =
  productIdParamsSchema;

export default {
  productIdParamsSchema,
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
};