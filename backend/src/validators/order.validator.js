import Joi from "joi";

/*
|--------------------------------------------------------------------------
| Order ID
|--------------------------------------------------------------------------
*/

export const orderIdParamsSchema =
  Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  });

/*
|--------------------------------------------------------------------------
| Update Order Status
|--------------------------------------------------------------------------
*/

export const updateOrderStatusSchema =
  Joi.object({
    status: Joi.string()
      .valid(
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
      )
      .required(),
  });

/*
|--------------------------------------------------------------------------
| Order Query
|--------------------------------------------------------------------------
*/

export const orderQuerySchema =
  Joi.object({
    page: Joi.number()
      .integer()
      .positive()
      .default(1),

    limit: Joi.number()
      .integer()
      .positive()
      .max(100)
      .default(20),

    status: Joi.string()
      .valid(
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
      )
      .optional(),

    userId: Joi.number()
      .integer()
      .positive()
      .optional(),
  });

export default {
  orderIdParamsSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
};