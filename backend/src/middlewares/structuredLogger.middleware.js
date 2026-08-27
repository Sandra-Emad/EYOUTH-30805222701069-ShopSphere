import logger from "../utils/logger.js";

const structuredLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request completed", {
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ipAddress: req.ip || null,
      userId: req.user?.userId ? Number(req.user.userId) : null,
    });
  });

  next();
};

export default structuredLogger;
