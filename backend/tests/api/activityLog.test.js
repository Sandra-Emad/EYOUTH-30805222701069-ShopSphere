import request from "supertest";
import mongoose from "mongoose";

import app from "../../src/app.js";
import ActivityLog from "../../src/models/activityLog.model.js";
import testPrisma from "../../src/config/test-prisma.js";
import connectMongoDB from "../../src/config/mongodb.js";

describe("Activity Log API", () => {
  let adminToken;
  let customerToken;

  let adminUserId;
  let customerUserId;

  const adminEmail = `activity-admin-${Date.now()}@example.com`;
  const customerEmail = `activity-customer-${Date.now()}@example.com`;

  const password = "Password123!";

  beforeAll(async () => {
    /*
     * ============================================================
     * 1. Connect to MongoDB
     * ============================================================
     */

    if (mongoose.connection.readyState !== 1) {
      await connectMongoDB();
    }

    expect(mongoose.connection.readyState).toBe(1);

    /*
     * ============================================================
     * 2. Make sure test Prisma is connected
     * ============================================================
     */

    await testPrisma.$connect();

    /*
     * ============================================================
     * 3. Register admin user
     * ============================================================
     */

    const adminRegister = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Activity Admin",
        email: adminEmail,
        password,
      });

    expect([200, 201]).toContain(adminRegister.status);
    expect(adminRegister.body.user).toBeDefined();
    expect(adminRegister.body.user.id).toBeDefined();

    adminUserId = adminRegister.body.user.id;

    /*
     * ============================================================
     * 4. Register customer user
     * ============================================================
     */

    const customerRegister = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Activity Customer",
        email: customerEmail,
        password,
      });

    expect([200, 201]).toContain(customerRegister.status);
    expect(customerRegister.body.user).toBeDefined();
    expect(customerRegister.body.user.id).toBeDefined();

    customerUserId = customerRegister.body.user.id;

    /*
     * ============================================================
     * 5. Make admin user ADMIN
     * ============================================================
     */

    const adminBeforeUpdate = await testPrisma.user.findUnique({
      where: {
        id: adminUserId,
      },
    });

    expect(adminBeforeUpdate).toBeDefined();

    await testPrisma.user.update({
      where: {
        id: adminUserId,
      },
      data: {
        role: "ADMIN",
      },
    });

    /*
     * ============================================================
     * 6. Login as ADMIN
     * ============================================================
     */

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: adminEmail,
        password,
      });

    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.token).toBeDefined();

    adminToken = adminLogin.body.token;

    /*
     * ============================================================
     * 7. Login as CUSTOMER
     * ============================================================
     */

    const customerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: customerEmail,
        password,
      });

    expect(customerLogin.status).toBe(200);
    expect(customerLogin.body.token).toBeDefined();

    customerToken = customerLogin.body.token;
  }, 30000);

  afterAll(async () => {
    /*
     * ============================================================
     * Cleanup MongoDB test logs
     * ============================================================
     */

    try {
      if (mongoose.connection.readyState === 1) {
        const userIds = [
          adminUserId,
          customerUserId,
        ].filter(
          (id) => id !== undefined && id !== null
        );

        await ActivityLog.deleteMany({
          $or: [
            ...(userIds.length > 0
              ? [
                  {
                    userId: {
                      $in: userIds,
                    },
                  },
                ]
              : []),

            {
              endpoint: {
                $regex: "^/api/activity-logs",
              },
            },

            {
              action: {
                $in: [
                  "ACTIVITY_LOG_TEST",
                  "TEST_LIST",
                  "PAGINATION_TEST",
                  "FILTER_ACTION_TEST",
                  "FILTER_ENTITY_TEST",
                  "FILTER_USER_TEST",
                  "GET_BY_ID_TEST",
                ],
              },
            },
          ],
        });
      }
    } catch (error) {
      // Ignore MongoDB cleanup errors
    }

    /*
     * ============================================================
     * Cleanup PostgreSQL test users
     * ============================================================
     */

    try {
      if (adminUserId) {
        await testPrisma.user.delete({
          where: {
            id: adminUserId,
          },
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    try {
      if (customerUserId) {
        await testPrisma.user.delete({
          where: {
            id: customerUserId,
          },
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    /*
     * ============================================================
     * Close MongoDB connection
     * ============================================================
     */

    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch (error) {
      // Ignore MongoDB disconnect errors
    }

    /*
     * ============================================================
     * Close Prisma test connection
     * ============================================================
     */

    try {
      await testPrisma.$disconnect();
    } catch (error) {
      // Ignore Prisma disconnect errors
    }
  }, 30000);

  /*
   * ============================================================
   * MongoDB / ActivityLog model
   * ============================================================
   */

  describe("MongoDB / ActivityLog model", () => {
    test("ActivityLog model should be connected to MongoDB", async () => {
      expect(mongoose.connection.readyState).toBe(1);
    });

    test("should create an activity log", async () => {
      const log = await ActivityLog.create({
        userId: adminUserId,
        action: "CREATE",
        entity: "Product",
        entityId: "123",
        details: {
          name: "Activity Test Product",
        },
        method: "POST",
        endpoint: "/api/products",
        ipAddress: "127.0.0.1",
      });

      expect(log).toBeDefined();
      expect(log._id).toBeDefined();

      expect(log.action).toBe("CREATE");
      expect(log.entity).toBe("Product");
      expect(log.entityId).toBe("123");

      await ActivityLog.deleteOne({
        _id: log._id,
      });
    });
  });

  /*
   * ============================================================
   * Authentication
   * ============================================================
   */

  describe("Authentication", () => {
    test(
      "unauthenticated user should not access activity logs",
      async () => {
        const response = await request(app)
          .get("/api/activity-logs");

        expect(response.status).toBe(401);
      }
    );

    test(
      "unauthenticated user should not access activity log by id",
      async () => {
        const response = await request(app)
          .get(
            "/api/activity-logs/507f1f77bcf86cd799439011"
          );

        expect(response.status).toBe(401);
      }
    );

    test(
      "customer should not access activity logs",
      async () => {
        const response = await request(app)
          .get("/api/activity-logs")
          .set(
            "Authorization",
            `Bearer ${customerToken}`
          );

        expect(response.status).toBe(403);
      }
    );

    test(
      "customer should not access activity log by id",
      async () => {
        const response = await request(app)
          .get(
            "/api/activity-logs/507f1f77bcf86cd799439011"
          )
          .set(
            "Authorization",
            `Bearer ${customerToken}`
          );

        expect(response.status).toBe(403);
      }
    );
  });

  /*
   * ============================================================
   * Validation
   * ============================================================
   */

  describe("Validation", () => {
    test("should reject invalid page", async () => {
      const response = await request(app)
        .get("/api/activity-logs")
        .query({
          page: 0,
        })
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject invalid limit", async () => {
      const response = await request(app)
        .get("/api/activity-logs")
        .query({
          limit: 101,
        })
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject invalid userId", async () => {
      const response = await request(app)
        .get("/api/activity-logs")
        .query({
          userId: "not-a-number",
        })
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should reject invalid activity log id", async () => {
      const response = await request(app)
        .get(
          "/api/activity-logs/not-a-valid-id"
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  /*
   * ============================================================
   * Activity Log Retrieval
   * ============================================================
   */

  describe("Activity Log Retrieval", () => {
    test(
      "GET /api/activity-logs should return activity logs",
      async () => {
        await ActivityLog.create({
          userId: adminUserId,
          action: "TEST_LIST",
          entity: "ActivityLog",
          entityId: "list-test",
          details: {
            test: true,
          },
          method: "GET",
          endpoint: "/api/activity-logs",
          ipAddress: "127.0.0.1",
        });

        const response = await request(app)
          .get("/api/activity-logs")
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(
          Array.isArray(response.body.logs)
        ).toBe(true);

        expect(
          response.body.pagination
        ).toBeDefined();

        expect(
          response.body.pagination.page
        ).toBe(1);

        expect(
          response.body.pagination.limit
        ).toBe(20);

        expect(
          typeof response.body.pagination.total
        ).toBe("number");

        expect(
          typeof response.body.pagination.pages
        ).toBe("number");
      }
    );

    test("should support pagination", async () => {
      await ActivityLog.create({
        userId: adminUserId,
        action: "PAGINATION_TEST",
        entity: "ActivityLog",
        entityId: "pagination-1",
        details: {},
      });

      await ActivityLog.create({
        userId: adminUserId,
        action: "PAGINATION_TEST",
        entity: "ActivityLog",
        entityId: "pagination-2",
        details: {},
      });

      const response = await request(app)
        .get("/api/activity-logs")
        .query({
          page: 1,
          limit: 1,
        })
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        response.body.pagination.page
      ).toBe(1);

      expect(
        response.body.pagination.limit
      ).toBe(1);

      expect(
        response.body.logs.length
      ).toBeLessThanOrEqual(1);
    });

    test("should support action filtering", async () => {
      await ActivityLog.create({
        userId: adminUserId,
        action: "FILTER_ACTION_TEST",
        entity: "Product",
        entityId: "action-1",
        details: {},
      });

      const response = await request(app)
        .get("/api/activity-logs")
        .query({
          action: "FILTER_ACTION_TEST",
        })
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        Array.isArray(response.body.logs)
      ).toBe(true);

      for (const log of response.body.logs) {
        expect(log.action).toBe(
          "FILTER_ACTION_TEST"
        );
      }
    });

    test("should support entity filtering", async () => {
      await ActivityLog.create({
        userId: adminUserId,
        action: "FILTER_ENTITY_TEST",
        entity: "ActivityLogTestEntity",
        entityId: "entity-1",
        details: {},
      });

      const response = await request(app)
        .get("/api/activity-logs")
        .query({
          entity: "ActivityLogTestEntity",
        })
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        Array.isArray(response.body.logs)
      ).toBe(true);

      for (const log of response.body.logs) {
        expect(log.entity).toBe(
          "ActivityLogTestEntity"
        );
      }
    });

    test("should support userId filtering", async () => {
      await ActivityLog.create({
        userId: customerUserId,
        action: "FILTER_USER_TEST",
        entity: "User",
        entityId: String(customerUserId),
        details: {},
      });

      const response = await request(app)
        .get("/api/activity-logs")
        .query({
          userId: customerUserId,
        })
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(
        Array.isArray(response.body.logs)
      ).toBe(true);

      for (const log of response.body.logs) {
        expect(log.userId).toBe(customerUserId);
      }
    });

    test(
      "GET /api/activity-logs/:id should return 404 for valid but nonexistent id",
      async () => {
        const response = await request(app)
          .get(
            "/api/activity-logs/507f1f77bcf86cd799439011"
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);

        expect(
          response.body.message
        ).toBe("Activity log not found");
      }
    );

    test(
      "GET /api/activity-logs/:id should return an existing log",
      async () => {
        const log = await ActivityLog.create({
          userId: adminUserId,
          action: "GET_BY_ID_TEST",
          entity: "ActivityLog",
          entityId: "get-by-id",
          details: {
            test: true,
          },
          method: "GET",
          endpoint: "/api/activity-logs/test",
          ipAddress: "127.0.0.1",
        });

        const response = await request(app)
          .get(
            `/api/activity-logs/${log._id.toString()}`
          )
          .set(
            "Authorization",
            `Bearer ${adminToken}`
          );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(
          response.body.log
        ).toBeDefined();

        expect(
          response.body.log._id
        ).toBe(log._id.toString());

        expect(
          response.body.log.action
        ).toBe("GET_BY_ID_TEST");

        expect(
          response.body.log.entity
        ).toBe("ActivityLog");
      }
    );
  });

  /*
   * ============================================================
   * Activity Log Service / Database
   * ============================================================
   */

  describe("Activity Log Service / Database", () => {
    test(
      "should be able to create and retrieve an activity log",
      async () => {
        const createdLog =
          await ActivityLog.create({
            userId: adminUserId,
            action: "ACTIVITY_LOG_TEST",
            entity: "Test",
            entityId: "test-123",
            details: {
              source: "jest",
            },
            method: "POST",
            endpoint: "/api/activity-logs/test",
            ipAddress: "127.0.0.1",
          });

        expect(createdLog).toBeDefined();
        expect(createdLog._id).toBeDefined();

        const foundLog =
          await ActivityLog.findById(
            createdLog._id
          ).lean();

        expect(foundLog).toBeDefined();
        expect(foundLog).not.toBeNull();

        expect(foundLog.action).toBe(
          "ACTIVITY_LOG_TEST"
        );

        expect(foundLog.entity).toBe("Test");

        expect(foundLog.entityId).toBe(
          "test-123"
        );

        expect(foundLog.details).toEqual({
          source: "jest",
        });
      }
    );
  });
});