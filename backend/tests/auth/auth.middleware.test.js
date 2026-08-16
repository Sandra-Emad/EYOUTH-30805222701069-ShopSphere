import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import jwt from "jsonwebtoken";

import authenticate, {
  requireRole,
} from "../../src/middlewares/auth.middleware.js";

describe("Authentication Middleware", () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    jest.restoreAllMocks();
  });

  test("should reject request without authorization header", () => {
    const req = {
      headers: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("should reject invalid authorization format", () => {
    const req = {
      headers: {
        authorization: "Basic some-token",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid authorization format",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("should reject missing JWT secret", () => {
    delete process.env.JWT_SECRET;

    const req = {
      headers: {
        authorization: "Bearer some-token",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication configuration error",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("should reject invalid token", () => {
    const req = {
      headers: {
        authorization: "Bearer invalid-token",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid token",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("should reject expired token", () => {
    const token = jwt.sign(
      {
        userId: 1,
        email: "expired@example.com",
        role: "CUSTOMER",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "-1s",
      }
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Token expired",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("should authenticate valid token", () => {
    const payload = {
      userId: 123,
      email: "user@example.com",
      role: "CUSTOMER",
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(req.user).toEqual(
      expect.objectContaining(payload)
    );

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).not.toHaveBeenCalled();
  });
});

describe("Role Authorization Middleware", () => {
  test("should reject request when user is missing", () => {
    const req = {};

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = requireRole("ADMIN");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("should reject CUSTOMER from ADMIN-only route", () => {
    const req = {
      user: {
        userId: 1,
        email: "customer@example.com",
        role: "CUSTOMER",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = requireRole("ADMIN");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      message: "Access denied",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("should allow ADMIN to access ADMIN-only route", () => {
    const req = {
      user: {
        userId: 1,
        email: "admin@example.com",
        role: "ADMIN",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = requireRole("ADMIN");

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).not.toHaveBeenCalled();
  });

  test("should allow any configured role", () => {
    const req = {
      user: {
        userId: 1,
        email: "customer@example.com",
        role: "CUSTOMER",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    const middleware = requireRole(
      "CUSTOMER",
      "ADMIN"
    );

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).not.toHaveBeenCalled();
  });
});