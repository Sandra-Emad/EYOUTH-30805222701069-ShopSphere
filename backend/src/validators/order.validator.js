import Joi from "joi";

export const createOrderSchema = Joi.object({
  userId: Joi.number()
    .integer()
    .positive()
    .required(),

  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number()
          .integer()
          .positive()
          .required(),

        quantity: Joi.number()
          .integer()
          .positive()
          .required(),
      })
    )
    .min(1)
    .required(),
});

export const updateOrderStatusSchema = Joi.object({
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