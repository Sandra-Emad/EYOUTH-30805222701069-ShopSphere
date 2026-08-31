import logger from "../utils/logger.js";

const errorMiddleware = (err, req, res, next) => {
  logger.error("Unhandled error", {
    method: req.method,
    endpoint: req.originalUrl,
    statusCode: err.statusCode || 500,
    errorName: err.name || "Error",
    errorMessage: err.message || "Internal server error",
  });

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

export default errorMiddleware;
