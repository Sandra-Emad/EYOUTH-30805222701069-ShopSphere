import request from "supertest";
import mongoose from "mongoose";

import app from "../../src/app.js";
import testPrisma from "../../src/config/test-prisma.js";
import connectMongoDB from "../../src/config/mongodb.js";

if (typeof jest !== "undefined") {
  jest.setTimeout(20000);
}

describe("Statistics API", () => {
  let adminToken;
  let customerToken;

  let adminUserId;
  let customerUserId;

  const adminEmail = `statistics-admin-${Date.now()}@example.com`;
  const customerEmail = `statistics-customer-${Date.now()}@example.com`;
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
     * 2. Register admin
     * ============================================================
     */

    const adminRegister = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Statistics Admin",
        email: adminEmail,
        password,
      });

    expect([200, 201]).toContain(adminRegister.status);
    expect(adminRegister.body.user).toBeDefined();
    expect(adminRegister.body.user.id).toBeDefined();

    adminUserId = adminRegister.body.user.id;

    /*
     * ============================================================
     * 3. Register customer
     * ============================================================
     */

    const customerRegister = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Statistics Customer",
        email: customerEmail,
        password,
      });

    expect([200, 201]).toContain(customerRegister.status);
    expect(customerRegister.body.user).toBeDefined();
    expect(customerRegister.body.user.id).toBeDefined();

    customerUserId = customerRegister.body.user.id;

    /*
     * ============================================================
     * 4. Promote admin to ADMIN
     * ============================================================
     */

    const adminBeforeUpdate = await testPrisma.user.findUnique({
      where: {
        id: adminUserId,
      },
    });

    expect(adminBeforeUpdate).toBeTruthy();

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
     * 5. Login as ADMIN
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
     * 6. Login as CUSTOMER
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
  }, 20000);

  afterAll(async () => {
    /*
     * ============================================================
     * Cleanup users
     * ============================================================
     */

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

    /*
     * ============================================================
     * Close MongoDB
     * ============================================================
     */

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    /*
     * ============================================================
     * Disconnect Prisma
     * ============================================================
     */

    await testPrisma.$disconnect();
  }, 20000);

  /*
   * ============================================================
   * Authentication
   * ============================================================
   */

  describe("Authentication", () => {
    test("unauthenticated user should not access statistics", async () => {
      const response = await request(app).get("/api/statistics");

      expect(response.status).toBe(401);
    });

    test("customer should not access statistics", async () => {
      const response = await request(app)
        .get("/api/statistics")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    test("admin should be able to access statistics", async () => {
      const response = await request(app)
        .get("/api/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.statistics).toBeDefined();
    });
  });

  /*
   * ============================================================
   * Statistics Response
   * ============================================================
   */

  describe("Statistics Response", () => {
    test("should return users count", async () => {
      const response = await request(app)
        .get("/api/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(typeof response.body.statistics.users).toBe("number");
    });

    test("should return products count", async () => {
      const response = await request(app)
        .get("/api/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(typeof response.body.statistics.products).toBe("number");
    });

    test("should return categories count", async () => {
      const response = await request(app)
        .get("/api/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(typeof response.body.statistics.categories).toBe("number");
    });

    test("should return orders count", async () => {
      const response = await request(app)
        .get("/api/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(typeof response.body.statistics.orders).toBe("number");
    });

    test("should return revenue", async () => {
      const response = await request(app)
        .get("/api/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(typeof response.body.statistics.revenue).toBe("number");
    });

    test("should return orders grouped by status", async () => {
      const response = await request(app)
        .get("/api/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(response.body.statistics.ordersByStatus).toBeDefined();

      expect(response.body.statistics.ordersByStatus.pending).toEqual(
        expect.any(Number)
      );

      expect(response.body.statistics.ordersByStatus.processing).toEqual(
        expect.any(Number)
      );

      expect(response.body.statistics.ordersByStatus.shipped).toEqual(
        expect.any(Number)
      );

      expect(response.body.statistics.ordersByStatus.delivered).toEqual(
        expect.any(Number)
      );

      expect(response.body.statistics.ordersByStatus.cancelled).toEqual(
        expect.any(Number)
      );
    });
  });
});