process.env.NODE_ENV = "test";

import request from "supertest";
import bcrypt from "bcryptjs";

import app from "../../src/app.js";
import testPrisma from "../../src/config/test-prisma.js";

describe("Category API", () => {
  const categoryName = `Test Category ${Date.now()}`;

  const adminEmail = `category-admin-${Date.now()}@example.com`;
  const adminPassword = "Admin12345";

  const customerEmail = `category-customer-${Date.now()}@example.com`;
  const customerPassword = "Customer12345";

  let categoryId;
  let adminToken;
  let customerToken;
  let adminId;
  let customerId;

  beforeAll(async () => {
    await testPrisma.$connect();

    const hashedAdminPassword = await bcrypt.hash(
      adminPassword,
      12
    );

    const admin = await testPrisma.user.create({
      data: {
        name: "Category Test Admin",
        email: adminEmail,
        password: hashedAdminPassword,
        role: "ADMIN",
      },
    });

    adminId = admin.id;

    const hashedCustomerPassword = await bcrypt.hash(
      customerPassword,
      12
    );

    const customer = await testPrisma.user.create({
      data: {
        name: "Category Test Customer",
        email: customerEmail,
        password: hashedCustomerPassword,
        role: "CUSTOMER",
      },
    });

    customerId = customer.id;

    const adminLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: adminEmail,
        password: adminPassword,
      });

    expect(adminLoginResponse.statusCode).toBe(200);

    adminToken = adminLoginResponse.body.token;

    const customerLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: customerEmail,
        password: customerPassword,
      });

    expect(customerLoginResponse.statusCode).toBe(200);

    customerToken = customerLoginResponse.body.token;
  });

  afterAll(async () => {
    await testPrisma.category.deleteMany({
      where: {
        name: {
          startsWith: "Test Category",
        },
      },
    });

    await testPrisma.user.deleteMany({
      where: {
        id: {
          in: [adminId, customerId],
        },
      },
    });
  });

  test("should create a category successfully", async () => {
    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: categoryName,
        description: "Test category description",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.message).toBe(
      "Category created successfully"
    );

    expect(response.body.category.name).toBe(
      categoryName
    );

    categoryId = response.body.category.id;
  });

  test("should get all categories", async () => {
    const response = await request(app).get(
      "/api/categories"
    );

    expect(response.statusCode).toBe(200);

    expect(
      Array.isArray(response.body.categories)
    ).toBe(true);
  });

  test("should get category by id", async () => {
    const response = await request(app).get(
      `/api/categories/${categoryId}`
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.category.id).toBe(
      categoryId
    );
  });

  test("should update a category", async () => {
    const updatedName = `${categoryName} Updated`;

    const response = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: updatedName,
        description: "Updated description",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Category updated successfully"
    );

    expect(response.body.category.name).toBe(
      updatedName
    );
  });

  test("should reject duplicate category names", async () => {
    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `${categoryName} Updated`,
        description: "Duplicate",
      });

    expect(response.statusCode).toBe(409);

    expect(response.body.message).toBe(
      "Category already exists"
    );
  });

  test("should reject invalid category data", async () => {
    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "A",
      });

    expect(response.statusCode).toBe(400);
  });

  test("should return 404 for a non-existing category", async () => {
    const response = await request(app).get(
      "/api/categories/999999"
    );

    expect(response.statusCode).toBe(404);

    expect(response.body.message).toBe(
      "Category not found"
    );
  });

  test("should reject category creation without authentication", async () => {
    const response = await request(app)
      .post("/api/categories")
      .send({
        name: `Unauthorized Category ${Date.now()}`,
        description: "Unauthorized",
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.message).toBe(
      "Authentication required"
    );
  });

  test("should reject category update without authentication", async () => {
    const response = await request(app)
      .put(`/api/categories/${categoryId}`)
      .send({
        name: `Unauthorized Update ${Date.now()}`,
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.message).toBe(
      "Authentication required"
    );
  });

  test("should reject category deletion without authentication", async () => {
    const response = await request(app)
      .delete(`/api/categories/${categoryId}`);

    expect(response.statusCode).toBe(401);

    expect(response.body.message).toBe(
      "Authentication required"
    );
  });

  test("should reject CUSTOMER from creating a category", async () => {
    const response = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        name: `Customer Category ${Date.now()}`,
        description: "Customer should not create",
      });

    expect(response.statusCode).toBe(403);

    expect(response.body.message).toBe(
      "Access denied"
    );
  });

  test("should reject CUSTOMER from updating a category", async () => {
    const response = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        name: `Customer Update ${Date.now()}`,
      });

    expect(response.statusCode).toBe(403);

    expect(response.body.message).toBe(
      "Access denied"
    );
  });

  test("should reject CUSTOMER from deleting a category", async () => {
    const response = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.statusCode).toBe(403);

    expect(response.body.message).toBe(
      "Access denied"
    );
  });

  test("should delete a category successfully", async () => {
    const response = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Category deleted successfully"
    );
  });
});