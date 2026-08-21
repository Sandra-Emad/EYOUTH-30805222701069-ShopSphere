import Joi from "joi";

const getActivityLogsSchema =
  Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(50),

    userId: Joi.number()
      .integer()
      .positive()
      .optional(),

    action: Joi.string()
      .trim()
      .min(1)
      .optional(),

    entity: Joi.string()
      .trim()
      .min(1)
      .optional(),
  });

export {
  getActivityLogsSchema,
};

export default {
  getActivityLogsSchema,
};