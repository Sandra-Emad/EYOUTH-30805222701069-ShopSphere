import request from "supertest";

import app from "../../src/app.js";
import testPrisma from "../../src/config/test-prisma.js";

describe("Email API Integration", () => {
  let userId;

  const email =
    `email-test-${Date.now()}@example.com`;

  const password = "Password123!";

  beforeAll(async () => {
    /*
     * ============================================================
     * Make sure SMTP is not required for registration tests
     * ============================================================
     */

    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.EMAIL_FROM;
  });

  afterAll(async () => {
    /*
     * ============================================================
     * Cleanup test user
     * ============================================================
     */

    try {
      if (userId) {
        await testPrisma.user.delete({
          where: {
            id: userId,
          },
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    await testPrisma.$disconnect();
  });

  describe("Welcome Email", () => {
    test(
      "registration should succeed when SMTP configuration is missing",
      async () => {
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            name: "Email Test User",
            email,
            password,
          });

        expect(
          [200, 201]
        ).toContain(response.status);

        expect(
          response.body.user
        ).toBeDefined();

        expect(
          response.body.user.id
        ).toBeDefined();

        expect(
          response.body.user.email
        ).toBe(email);

        userId =
          response.body.user.id;
      }
    );

    test(
      "registration should not fail because welcome email fails",
      async () => {
        const failingEmail =
          `email-failure-${Date.now()}@example.com`;

        const response = await request(app)
          .post("/api/auth/register")
          .send({
            name: "Email Failure Test",
            email: failingEmail,
            password,
          });

        expect(
          [200, 201]
        ).toContain(response.status);

        expect(
          response.body.user
        ).toBeDefined();

        expect(
          response.body.user.email
        ).toBe(failingEmail);

        const createdUser =
          await testPrisma.user.findUnique({
            where: {
              email: failingEmail,
            },
          });

        expect(createdUser).toBeDefined();

        if (createdUser) {
          try {
            await testPrisma.user.delete({
              where: {
                id: createdUser.id,
              },
            });
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
    );
  });
});