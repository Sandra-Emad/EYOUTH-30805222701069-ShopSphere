process.env.NODE_ENV = "test";

import request from "supertest";
import bcrypt from "bcryptjs";

import app from "../../src/app.js";
import testPrisma from "../../src/config/test-prisma.js";

describe("Order API", () => {
  let user;
  let category;
  let product;
  let orderId;

  let userToken;
  let adminToken;
  let adminId;

  const userEmail = `order-test-${Date.now()}@example.com`;
  const userPassword = "User12345";

  const adminEmail = `order-admin-${Date.now()}@example.com`;
  const adminPassword = "Admin12345";

  const categoryName = `Order Test Category ${Date.now()}`;
  const productName = `Order Test Product ${Date.now()}`;

  beforeAll(async () => {
    await testPrisma.$connect();

    const hashedUserPassword = await bcrypt.hash(
      userPassword,
      12
    );

    user = await testPrisma.user.create({
      data: {
        name: "Order Test User",
        email: userEmail,
        password: hashedUserPassword,
        role: "CUSTOMER",
      },
    });

    const hashedAdminPassword = await bcrypt.hash(
      adminPassword,
      12
    );

    const admin = await testPrisma.user.create({
      data: {
        name: "Order Test Admin",
        email: adminEmail,
        password: hashedAdminPassword,
        role: "ADMIN",
      },
    });

    adminId = admin.id;

    const userLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: userEmail,
        password: userPassword,
      });

    expect(userLoginResponse.statusCode).toBe(200);

    userToken = userLoginResponse.body.token;

    const adminLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: adminEmail,
        password: adminPassword,
      });

    expect(adminLoginResponse.statusCode).toBe(200);

    adminToken = adminLoginResponse.body.token;

    category = await testPrisma.category.create({
      data: {
        name: categoryName,
        description: "Order test category",
      },
    });

    product = await testPrisma.product.create({
      data: {
        name: productName,
        description: "Order test product",
        price: 100,
        stock: 10,
        categoryId: category.id,
      },
    });
  });

  afterAll(async () => {
    await testPrisma.orderItem.deleteMany({
      where: {
        productId: product.id,
      },
    });

    await testPrisma.order.deleteMany({
      where: {
        userId: user.id,
      },
    });

    await testPrisma.product.deleteMany({
      where: {
        id: product.id,
      },
    });

    await testPrisma.category.deleteMany({
      where: {
        id: category.id,
      },
    });

    await testPrisma.user.deleteMany({
      where: {
        id: user.id,
      },
    });

    await testPrisma.user.deleteMany({
      where: {
        id: adminId,
      },
    });
  });

  test("should create an order successfully", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId: user.id,
        items: [
          {
            productId: product.id,
            quantity: 2,
          },
        ],
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.message).toBe(
      "Order created successfully"
    );

    expect(response.body.order).toHaveProperty("id");

    expect(Number(response.body.order.totalAmount)).toBe(200);

    expect(response.body.order.user.id).toBe(user.id);

    expect(response.body.order.items).toHaveLength(1);

    expect(
      response.body.order.items[0].product.id
    ).toBe(product.id);

    expect(
      response.body.order.items[0].quantity
    ).toBe(2);

    orderId = response.body.order.id;
  });

  test("should reduce product stock after creating an order", async () => {
    const updatedProduct =
      await testPrisma.product.findUnique({
        where: {
          id: product.id,
        },
      });

    expect(updatedProduct.stock).toBe(8);
  });

  test("should get all orders", async () => {
    const response = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);

    expect(Array.isArray(response.body.orders)).toBe(true);

    expect(
      response.body.orders.some(
        (order) => order.id === orderId
      )
    ).toBe(true);
  });

  test("should get order by id", async () => {
    const response = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.order.id).toBe(orderId);

    expect(response.body.order.user.id).toBe(user.id);
  });

  test("should update order status", async () => {
    const response = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "PROCESSING",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Order status updated successfully"
    );

    expect(response.body.order.status).toBe(
      "PROCESSING"
    );
  });

  test("should reject order for non-existing user", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId: 999999,
        items: [
          {
            productId: product.id,
            quantity: 1,
          },
        ],
      });

    expect(response.statusCode).toBe(404);

    expect(response.body.message).toBe(
      "User not found"
    );
  });

  test("should reject order for non-existing product", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId: user.id,
        items: [
          {
            productId: 999999,
            quantity: 1,
          },
        ],
      });

    expect(response.statusCode).toBe(404);

    expect(response.body.message).toBe(
      "Product with id 999999 not found"
    );
  });

  test("should reject order when stock is insufficient", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId: user.id,
        items: [
          {
            productId: product.id,
            quantity: 100,
          },
        ],
      });

    expect(response.statusCode).toBe(409);

    expect(response.body.message).toContain(
      "Insufficient stock"
    );
  });

  test("should reject invalid order data", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId: user.id,
        items: [],
      });

    expect(response.statusCode).toBe(400);
  });

  test("should return 404 for non-existing order", async () => {
    const response = await request(app)
      .get("/api/orders/999999")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.statusCode).toBe(404);

    expect(response.body.message).toBe(
      "Order not found"
    );
  });

  test("should delete an order successfully", async () => {
    const response = await request(app)
      .delete(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Order deleted successfully"
    );
  });

  test("should return 404 after deleting the order", async () => {
    const response = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.statusCode).toBe(404);

    expect(response.body.message).toBe(
      "Order not found"
    );
  });
});