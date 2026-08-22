process.env.NODE_ENV = "test";

import request from "supertest";

import app from "../../src/app.js";
import testPrisma from "../../src/config/test-prisma.js";

describe("Email API Integration", () => {
  const password = "Password123!";

  let createdUserIds = [];

  beforeAll(async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM;

    await testPrisma.$connect();
  }, 30000);

  afterAll(async () => {
    try {
      if (createdUserIds.length > 0) {
        await testPrisma.user.deleteMany({
          where: {
            id: {
              in: createdUserIds,
            },
          },
        });
      }
    } catch (error) {
      // Ignore cleanup errors.
    } finally {
      await testPrisma.$disconnect();
    }
  }, 30000);

  describe("Welcome Email", () => {
    test(
      "registration should succeed when SMTP configuration is missing",
      async () => {
        const email =
          `email-test-${Date.now()}@example.com`;

        const response = await request(app)
          .post("/api/auth/register")
          .send({
            name: "Email Test User",
            email,
            password,
          });

        expect([200, 201]).toContain(
          response.status
        );

        expect(response.body.user).toBeDefined();

        expect(response.body.user.id).toBeDefined();

        expect(response.body.user.email).toBe(
          email
        );

        createdUserIds.push(
          response.body.user.id
        );
      },
      30000
    );

    test(
      "registration should not fail because welcome email fails",
      async () => {
        const email =
          `email-failure-${Date.now()}@example.com`;

        const response = await request(app)
          .post("/api/auth/register")
          .send({
            name: "Email Failure Test",
            email,
            password,
          });

        expect([200, 201]).toContain(
          response.status
        );

        expect(response.body.user).toBeDefined();

        expect(response.body.user.id).toBeDefined();

        expect(response.body.user.email).toBe(
          email
        );

        createdUserIds.push(
          response.body.user.id
        );
      },
      30000
    );
  });
});