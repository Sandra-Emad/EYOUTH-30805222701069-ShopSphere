import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import app from "../../src/app.js";
import ActivityLog from "../../src/models/activityLog.model.js";
import {
  connectMongoDB,
  disconnectMongoDB,
} from "../../src/config/mongodb.js";

describe("Activity Log API Integration", () => {
  let adminToken;
  let adminUserId;
  let prisma;

  beforeAll(
    async () => {
      /*
       * =========================
       * Prisma
       * =========================
       */

      const databaseUrl =
        process.env.TEST_DATABASE_URL ||
        process.env.DATABASE_URL;

      if (!databaseUrl) {
        throw new Error(
          "PostgreSQL connection string is not configured. Set TEST_DATABASE_URL or DATABASE_URL."
        );
      }

      const adapter = new PrismaPg({
        connectionString: databaseUrl,
      });

      prisma = new PrismaClient({
        adapter,
      });

      await prisma.$connect();

      /*
       * =========================
       * MongoDB
       * =========================
       */

      await connectMongoDB();

      /*
       * Make sure MongoDB is actually connected
       */

      if (mongoose.connection.readyState !== 1) {
        throw new Error(
          "MongoDB connection was not established."
        );
      }

      /*
       * =========================
       * Create test user
       * =========================
       */

      const email = `activity-log-admin-${Date.now()}@test.com`;
      const password = "Password123";

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Activity Log Admin",
          email,
          password,
        });

      expect([200, 201]).toContain(
        registerResponse.status
      );

      /*
       * =========================
       * Get created user
       * =========================
       */

      const createdUser =
        await prisma.user.findUnique({
          where: {
            email,
          },
        });

      expect(createdUser).toBeTruthy();

      adminUserId = createdUser.id;

      /*
       * =========================
       * Promote user to ADMIN
       * =========================
       */

      await prisma.user.update({
        where: {
          id: createdUser.id,
        },
        data: {
          role: "ADMIN",
        },
      });

      /*
       * =========================
       * Login as admin
       * =========================
       */

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email,
          password,
        });

      expect(loginResponse.status).toBe(200);

      adminToken =
        loginResponse.body.token ||
        loginResponse.body.accessToken ||
        loginResponse.body.data?.token;

      expect(adminToken).toBeDefined();

      /*
       * =========================
       * Verify JWT
       * =========================
       */

      const decoded = jwt.verify(
        adminToken,
        process.env.JWT_SECRET
      );

      expect(decoded.role).toBe("ADMIN");
    },
    30000
  );

  afterAll(
    async () => {
      /*
       * Disconnect MongoDB
       */

      await disconnectMongoDB();

      /*
       * Disconnect Prisma
       */

      if (prisma) {
        await prisma.$disconnect();
      }
    },
    30000
  );

  describe("Authentication", () => {
    test(
      "GET /api/activity-logs should reject unauthenticated requests",
      async () => {
        const response = await request(app).get(
          "/api/activity-logs"
        );

        expect(response.status).toBe(401);
      }
    );

    test(
      "GET /api/activity-logs/:id should reject unauthenticated requests",
      async () => {
        const fakeId =
          new mongoose.Types.ObjectId().toString();

        const response = await request(app).get(
          `/api/activity-logs/${fakeId}`
        );

        expect(response.status).toBe(401);
      }
    );
  });

  describe("Validation", () => {
    test(
      "should reject invalid page",
      async () => {
        const response = await request(app)
          .get("/api/activity-logs")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .query({
            page: 0,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    );

    test(
      "should reject invalid limit",
      async () => {
        const response = await request(app)
          .get("/api/activity-logs")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .query({
            limit: 101,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    );

    test(
      "should reject invalid userId",
      async () => {
        const response = await request(app)
          .get("/api/activity-logs")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .query({
            userId: -1,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    );
  });

  describe("Automatic Activity Logging", () => {
    test(
      "should automatically persist an activity log for an authenticated mutation",
      async () => {
        const marker = `activity-log-product-${Date.now()}`;

        const response = await request(app)
          .post("/api/categories")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .send({
            name: marker,
            description:
              "Activity logger integration test",
          });

        expect(response.status).toBe(201);

        const categoryId =
          response.body.category?.id;

        await new Promise((resolve) =>
          setTimeout(resolve, 300)
        );

        const log =
          await ActivityLog.findOne({
            userId: adminUserId,
            method: "POST",
            endpoint: {
              $regex: "/api/categories",
            },
            entity: "Category",
            action: "CREATE",
          })
            .sort({
              createdAt: -1,
            })
            .lean();

        expect(log).not.toBeNull();

        expect(log.userId).toBeGreaterThan(0);

        expect(
          log.details.statusCode
        ).toBe(201);

        if (categoryId) {
          await prisma.category.delete({
            where: {
              id: categoryId,
            },
          });
        }
      },
      15000
    );
  });

  describe("Activity Log Retrieval", () => {
    test(
      "GET /api/activity-logs should return activity logs",
      async () => {
        const response = await request(app)
          .get("/api/activity-logs")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
          success: true,
        });

        expect(response.body.logs).toBeDefined();

        expect(
          Array.isArray(response.body.logs)
        ).toBe(true);

        expect(
          response.body.pagination
        ).toBeDefined();

        expect(
          response.body.pagination.page
        ).toBeDefined();

        expect(
          response.body.pagination.limit
        ).toBeDefined();

        expect(
          response.body.pagination.total
        ).toBeDefined();

        expect(
          response.body.pagination.pages
        ).toBeDefined();
      },
      10000
    );

    test(
      "should support pagination",
      async () => {
        const response = await request(app)
          .get("/api/activity-logs")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .query({
            page: 1,
            limit: 5,
          });

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(true);

        expect(
          response.body.pagination.page
        ).toBe(1);

        expect(
          response.body.pagination.limit
        ).toBe(5);
      },
      10000
    );

    test(
      "should support action filtering",
      async () => {
        const response = await request(app)
          .get("/api/activity-logs")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .query({
            action: "CREATE",
          });

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(true);

        expect(
          Array.isArray(response.body.logs)
        ).toBe(true);

        for (const log of response.body.logs) {
          expect(log.action).toBe("CREATE");
        }
      },
      10000
    );

    test(
      "should support entity filtering",
      async () => {
        const response = await request(app)
          .get("/api/activity-logs")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          )
          .query({
            entity: "Product",
          });

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(true);

        expect(
          Array.isArray(response.body.logs)
        ).toBe(true);

        for (const log of response.body.logs) {
          expect(log.entity).toBe("Product");
        }
      },
      10000
    );

    test(
      "GET /api/activity-logs/:id should return 404 for a valid but nonexistent ID",
      async () => {
        const fakeId =
          new mongoose.Types.ObjectId().toString();

        const response = await request(app)
          .get(
            `/api/activity-logs/${fakeId}`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

        expect(response.status).toBe(404);

        expect(response.body).toMatchObject({
          success: false,
          message: "Activity log not found",
        });
      },
      10000
    );

    test(
      "GET /api/activity-logs/:id should reject an invalid ID",
      async () => {
        const response = await request(app)
          .get(
            "/api/activity-logs/not-a-valid-id"
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
          success: false,
          message: "Invalid activity log ID",
        });
      },
      10000
    );
  });

  describe("Activity Log Service / Database", () => {
    test(
      "should be able to create and retrieve an activity log",
      async () => {
        const log =
          await ActivityLog.create({
            userId: 1,
            action: "TEST",
            entity: "TestEntity",
            entityId: "test-123",
            details: {
              source: "activity-log-test",
            },
          });

        expect(log).toBeDefined();
        expect(log._id).toBeDefined();
        expect(log.action).toBe("TEST");
        expect(log.entity).toBe("TestEntity");
        expect(log.entityId).toBe(
          "test-123"
        );

        const retrieved =
          await ActivityLog.findById(
            log._id
          );

        expect(retrieved).toBeDefined();
        expect(retrieved).not.toBeNull();
        expect(retrieved.action).toBe(
          "TEST"
        );
        expect(retrieved.entity).toBe(
          "TestEntity"
        );
        expect(retrieved.entityId).toBe(
          "test-123"
        );

        await ActivityLog.deleteOne({
          _id: log._id,
        });
      },
      15000
    );
  });
});