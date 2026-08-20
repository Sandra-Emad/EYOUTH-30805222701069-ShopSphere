import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // No Authorization header
    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Authorization header exists but has invalid format
    if (
      typeof authHeader !== "string" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const token = authHeader.substring(7).trim();

    // Empty Bearer token
    if (!token) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    // JWT secret must exist
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Authentication configuration error",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /*
     * Keep the complete decoded JWT payload.
     *
     * This is important because the application/tests may
     * depend on fields such as:
     * - userId
     * - id
     * - email
     * - role
     */
    req.user = decoded;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

export default authenticate;