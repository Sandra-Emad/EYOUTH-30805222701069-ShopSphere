import request from "supertest";

import app from "../../src/app.js";

describe("Backend API Audit", () => {
  describe("Health", () => {
    test("GET /api/health should return healthy response", async () => {
      const response = await request(app)
        .get("/api/health");

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "API is healthy",
        status: "OK",
      });

      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe("404 handling", () => {
    test("should return JSON 404 for unknown route", async () => {
      const response = await request(app)
        .get("/api/does-not-exist");

      expect(response.status).toBe(404);

      expect(response.body).toMatchObject({
        success: false,
      });

      expect(response.body.message).toContain(
        "Route not found"
      );
    });
  });

  describe("Authentication", () => {
    test("cart should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/cart");

      expect(response.status).toBe(401);

      expect(response.body.message).toBe(
        "Authentication required"
      );
    });

    test("orders should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/orders/my-orders");

      expect(response.status).toBe(401);
    });

    test("reviews write endpoint should reject unauthenticated requests", async () => {
      const response = await request(app)
        .post("/api/reviews/product/1")
        .send({
          rating: 5,
          comment: "Great product",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("Validation", () => {
    test("register should reject invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "not-an-email",
          password: "password123",
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Validation failed"
      );
    });

    test("login should reject invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: "password123",
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    test("cart should reject invalid quantity", async () => {
      const response = await request(app)
        .post("/api/cart/items")
        .send({
          productId: 1,
          quantity: -5,
        });

      expect(response.status).toBe(401);
    });

    test("review should reject invalid rating", async () => {
      const response = await request(app)
        .post("/api/reviews/product/1")
        .send({
          rating: 10,
          comment: "Invalid",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("Public APIs", () => {
    test("products endpoint should be publicly accessible", async () => {
      const response = await request(app)
        .get("/api/products");

      expect(response.status).toBe(200);
      expect(response.body.products).toBeDefined();
    });

    test("categories endpoint should be publicly accessible", async () => {
      const response = await request(app)
        .get("/api/categories");

      expect(response.status).toBe(200);
      expect(response.body.categories).toBeDefined();
    });
  });
});