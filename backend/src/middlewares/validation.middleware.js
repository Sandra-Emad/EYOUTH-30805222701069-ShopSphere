const validationMiddleware = (schema, property = "body") => {
  return (req, res, next) => {
    try {
      const value =
        property === "query"
          ? req.query
          : property === "params"
            ? req.params
            : req.body;

      const { error, value: validatedValue } =
        schema.validate(value, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        });
      }

      if (property === "query") {
        req.validatedQuery = validatedValue;
      } else if (property === "params") {
        req.validatedParams = validatedValue;
      } else {
        req.body = validatedValue;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validationMiddleware;