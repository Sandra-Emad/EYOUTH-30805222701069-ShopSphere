process.env.NODE_ENV = "test";

import request from "supertest";

import app from "../../src/app.js";
import prisma from "../../src/config/prisma.js";

describe("Registration API", () => {
  const testEmail = `test-${Date.now()}@example.com`;

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });

  });

  test("should register a new user successfully", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: testEmail,
        password: "Password123",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.message).toBe(
      "User registered successfully"
    );

    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.name).toBe("Test User");
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.role).toBe("CUSTOMER");

    expect(response.body.user).not.toHaveProperty("password");
  });

  test("should reject duplicate email", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Another User",
        email: testEmail,
        password: "Password123",
      });

    expect(response.statusCode).toBe(409);

    expect(response.body.message).toBe(
      "Email is already registered"
    );
  });
});