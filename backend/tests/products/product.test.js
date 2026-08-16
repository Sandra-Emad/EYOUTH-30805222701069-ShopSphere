process.env.NODE_ENV = "test";

import request from "supertest";
import bcrypt from "bcryptjs";

import app from "../../src/app.js";
import testPrisma from "../../src/config/test-prisma.js";

describe("Product API", () => {
  let categoryId;
  let productId;

  let adminToken;
  let customerToken;

  let adminId;
  let customerId;

  const adminEmail = `product-admin-${Date.now()}@example.com`;
  const adminPassword = "Admin12345";

  const customerEmail = `product-customer-${Date.now()}@example.com`;
  const customerPassword = "Customer12345";

  const categoryName = `Test Product Category ${Date.now()}`;
  const productName = `Test Product ${Date.now()}`;

  beforeAll(async () => {
    await testPrisma.$connect();

    const hashedAdminPassword = await bcrypt.hash(
      adminPassword,
      12
    );

    const admin = await testPrisma.user.create({
      data: {
        name: "Product Test Admin",
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
        name: "Product Test Customer",
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

    const category = await testPrisma.category.create({
      data: {
        name: categoryName,
        description: "Category for product tests",
      },
    });

    categoryId = category.id;
  });

  afterAll(async () => {
    await testPrisma.product.deleteMany({
      where: {
        name: {
          startsWith: "Test Product",
        },
      },
    });

    await testPrisma.category.deleteMany({
      where: {
        name: {
          startsWith: "Test Product Category",
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

  test("should create a product successfully", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: productName,
        description: "Test product description",
        price: 99.99,
        stock: 10,
        imageUrl: "https://example.com/product.jpg",
        categoryId,
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.message).toBe(
      "Product created successfully"
    );

    expect(response.body.product.name).toBe(
      productName
    );

    expect(response.body.product.categoryId).toBe(
      categoryId
    );

    productId = response.body.product.id;
  });

  test("should get all products", async () => {
    const response = await request(app).get(
      "/api/products"
    );

    expect(response.statusCode).toBe(200);

    expect(
      Array.isArray(response.body.products)
    ).toBe(true);
  });

  test("should get product by id", async () => {
    const response = await request(app).get(
      `/api/products/${productId}`
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.product.id).toBe(
      productId
    );

    expect(response.body.product.name).toBe(
      productName
    );
  });

  test("should update a product", async () => {
    const updatedName = `${productName} Updated`;

    const response = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: updatedName,
        description: "Updated product description",
        price: 149.99,
        stock: 20,
        imageUrl:
          "https://example.com/updated.jpg",
        categoryId,
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Product updated successfully"
    );

    expect(response.body.product.name).toBe(
      updatedName
    );

    expect(response.body.product.price).toBe(
      "149.99"
    );

    expect(response.body.product.stock).toBe(20);
  });

  test("should reject duplicate product names in the same category", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `${productName} Updated`,
        description: "Duplicate product",
        price: 199.99,
        stock: 5,
        categoryId,
      });

    expect(response.statusCode).toBe(409);

    expect(response.body.message).toBe(
      "Product already exists"
    );
  });

  test("should reject invalid product data", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "A",
        price: -10,
        stock: -5,
        categoryId: 0,
      });

    expect(response.statusCode).toBe(400);
  });

  test("should reject product with non-existing category", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: `Test Product Invalid Category ${Date.now()}`,
        description: "Invalid category test",
        price: 50,
        stock: 5,
        categoryId: 999999,
      });

    expect(response.statusCode).toBe(404);

    expect(response.body.message).toBe(
      "Category not found"
    );
  });

  test("should return 404 for a non-existing product", async () => {
    const response = await request(app).get(
      "/api/products/999999"
    );

    expect(response.statusCode).toBe(404);

    expect(response.body.message).toBe(
      "Product not found"
    );
  });

  test("should reject product creation without authentication", async () => {
    const response = await request(app)
      .post("/api/products")
      .send({
        name: `Unauthorized Product ${Date.now()}`,
        price: 50,
        stock: 5,
        categoryId,
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.message).toBe(
      "Authentication required"
    );
  });

  test("should reject product update without authentication", async () => {
    const response = await request(app)
      .put(`/api/products/${productId}`)
      .send({
        name: `Unauthorized Update ${Date.now()}`,
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.message).toBe(
      "Authentication required"
    );
  });

  test("should reject product deletion without authentication", async () => {
    const response = await request(app)
      .delete(`/api/products/${productId}`);

    expect(response.statusCode).toBe(401);

    expect(response.body.message).toBe(
      "Authentication required"
    );
  });

  test("should reject CUSTOMER from creating a product", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        name: `Customer Product ${Date.now()}`,
        description: "Customer should not create",
        price: 50,
        stock: 5,
        categoryId,
      });

    expect(response.statusCode).toBe(403);

    expect(response.body.message).toBe(
      "Access denied"
    );
  });

  test("should reject CUSTOMER from updating a product", async () => {
    const response = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        name: `Customer Product Update ${Date.now()}`,
      });

    expect(response.statusCode).toBe(403);

    expect(response.body.message).toBe(
      "Access denied"
    );
  });

  test("should reject CUSTOMER from deleting a product", async () => {
    const response = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.statusCode).toBe(403);

    expect(response.body.message).toBe(
      "Access denied"
    );
  });

  test("should delete a product successfully", async () => {
    const response = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Product deleted successfully"
    );
  });
});