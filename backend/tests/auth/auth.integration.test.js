process.env.NODE_ENV = "test";

import request from "supertest";

import app from "../../src/app.js";
import testPrisma from "../../src/config/test-prisma.js";

describe("Authentication API", () => {
  const testEmail = `auth-test-${Date.now()}@example.com`;
  const testPassword = "Password123";

  let token;
  let userId;

  beforeAll(async () => {
    await testPrisma.$connect();
  }, 30000);

  afterAll(async () => {
    try {
      if (userId) {
        await testPrisma.user.delete({
          where: {
            id: userId,
          },
        });
      }
    } catch (error) {
      // Ignore cleanup errors.
    } finally {
      await testPrisma.$disconnect();
    }
  }, 30000);

  test(
    "should register a new user successfully",
    async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Auth Test User",
          email: testEmail,
          password: testPassword,
        });

      expect(response.statusCode).toBe(201);

      expect(response.body.message).toBe(
        "User registered successfully"
      );

      expect(response.body.user).toHaveProperty("id");

      userId = response.body.user.id;

      expect(response.body.user.name).toBe(
        "Auth Test User"
      );

      expect(response.body.user.email).toBe(testEmail);

      expect(response.body.user.role).toBe("CUSTOMER");

      expect(response.body.user).not.toHaveProperty(
        "password"
      );
    },
    30000
  );

  test(
    "should reject duplicate email",
    async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Another User",
          email: testEmail,
          password: testPassword,
        });

      expect(response.statusCode).toBe(409);

      expect(response.body.message).toBe(
        "Email is already registered"
      );
    },
    30000
  );

  test(
    "should login successfully with valid credentials",
    async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.statusCode).toBe(200);

      expect(response.body.message).toBe(
        "Login successful"
      );

      expect(response.body.token).toBeDefined();

      expect(typeof response.body.token).toBe("string");

      expect(response.body.user).toHaveProperty(
        "id",
        userId
      );

      expect(response.body.user.email).toBe(testEmail);

      expect(response.body.user.role).toBe("CUSTOMER");

      expect(response.body.user).not.toHaveProperty(
        "password"
      );

      token = response.body.token;
    },
    30000
  );

  test(
    "should reject login with wrong password",
    async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: "WrongPassword123",
        });

      expect(response.statusCode).toBe(401);

      expect(response.body.message).toBe(
        "Invalid email or password"
      );
    },
    30000
  );

  test(
    "should reject login for non-existing email",
    async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "does-not-exist@example.com",
          password: testPassword,
        });

      expect(response.statusCode).toBe(401);

      expect(response.body.message).toBe(
        "Invalid email or password"
      );
    },
    30000
  );

  test(
    "should reject login with invalid email format",
    async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: testPassword,
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.message).toBe(
        "Validation failed"
      );
    },
    30000
  );

  test(
    "should reject access to /me without token",
    async () => {
      const response = await request(app).get(
        "/api/auth/me"
      );

      expect(response.statusCode).toBe(401);

      expect(response.body.message).toBe(
        "Authentication required"
      );
    },
    30000
  );

  test(
    "should reject access to /me with invalid token",
    async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set(
          "Authorization",
          "Bearer invalid-token"
        );

      expect(response.statusCode).toBe(401);

      expect(response.body.message).toBe(
        "Invalid token"
      );
    },
    30000
  );

  test(
    "should get current user with valid token",
    async () => {
      expect(token).toBeDefined();

      const response = await request(app)
        .get("/api/auth/me")
        .set(
          "Authorization",
          `Bearer ${token}`
        );

      expect(response.statusCode).toBe(200);

      expect(response.body.user).toHaveProperty(
        "id",
        userId
      );

      expect(response.body.user.name).toBe(
        "Auth Test User"
      );

      expect(response.body.user.email).toBe(testEmail);

      expect(response.body.user.role).toBe("CUSTOMER");

      expect(response.body.user).not.toHaveProperty(
        "password"
      );
    },
    30000
  );
});