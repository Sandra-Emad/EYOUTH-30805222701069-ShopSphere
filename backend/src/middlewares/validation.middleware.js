const validationMiddleware = (schema, options = undefined) => {
  return (req, res, next) => {
    let normalizedOptions;

    if (typeof options === "string") {
      normalizedOptions = {
        body: options === "body",
        query: options === "query",
        params: options === "params",
      };
    } else if (options === undefined) {
      normalizedOptions = {
        body: true,
        query: false,
        params: false,
      };
    } else {
      normalizedOptions = {
        body: false,
        query: false,
        params: false,
        ...options,
      };
    }

    const {
      body = false,
      query = false,
      params = false,
    } = normalizedOptions;

    const sources = {};

    if (body) {
      sources.body = req.body;
    }

    if (query) {
      sources.query = req.query;
    }

    if (params) {
      sources.params = req.params;
    }

    const errors = [];
    const validated = {};

    for (const [source, value] of Object.entries(sources)) {
      const result = schema.validate(value, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (result.error) {
        errors.push(
          ...result.error.details.map((detail) => ({
            source,
            message: detail.message,
            detail,
          }))
        );
      } else {
        validated[source] = result.value;
      }
    }

    if (errors.length > 0) {
      /*
       * Route params use their specific validation message.
       *
       * Example:
       * /api/product-images/not-a-number
       *
       * => "Invalid product ID"
       *
       * Body/query validation keeps the generic
       * "Validation failed" response used by the
       * authentication and API audit tests.
       */
      if (
        params &&
        !body &&
        !query &&
        errors.length > 0
      ) {
        return res.status(400).json({
          success: false,
          message: errors[0].message,
          errors: errors.map(
            (error) => error.message
          ),
        });
      }

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.map(
          (error) => error.message
        ),
      });
    }

    if (body && validated.body !== undefined) {
      req.body = validated.body;
    }

    /*
     * Express 5 exposes req.query as a getter.
     * Store validated query data separately instead of
     * attempting to assign to req.query.
     */
    if (query && validated.query !== undefined) {
      req.validatedQuery = validated.query;
    }

    if (params && validated.params !== undefined) {
      Object.assign(req.params, validated.params);
    }

    return next();
  };
};

export default validationMiddleware;