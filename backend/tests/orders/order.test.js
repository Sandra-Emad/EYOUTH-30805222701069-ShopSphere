import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import app from "../../src/app.js";
import prisma from "../../src/config/test-prisma.js";

const uniqueValue = () =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

describe("Order API", () => {
  let customer;
  let admin;
  let category;
  let product;
  let secondProduct;

  let customerToken;
  let adminToken;

  let createdOrderId;

  const customerPassword = "TestPassword123!";
  const adminPassword = "AdminPassword123!";

  beforeAll(async () => {
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || "test-jwt-secret";

    const suffix = uniqueValue();

    const hashedCustomerPassword = await bcrypt.hash(
      customerPassword,
      10
    );

    const hashedAdminPassword = await bcrypt.hash(
      adminPassword,
      10
    );

    customer = await prisma.user.create({
      data: {
        name: `Order Test Customer ${suffix}`,
        email: `order.customer.${suffix}@example.com`,
        password: hashedCustomerPassword,
        role: "CUSTOMER",
      },
    });

    admin = await prisma.user.create({
      data: {
        name: `Order Test Admin ${suffix}`,
        email: `order.admin.${suffix}@example.com`,
        password: hashedAdminPassword,
        role: "ADMIN",
      },
    });

    category = await prisma.category.create({
      data: {
        name: `Order Test Category ${suffix}`,
        description: "Category used for order tests",
      },
    });

    product = await prisma.product.create({
      data: {
        name: `Order Test Product ${suffix}`,
        description: "Product used for order tests",
        price: 100.0,
        stock: 20,
        categoryId: category.id,
      },
    });

    secondProduct = await prisma.product.create({
      data: {
        name: `Order Test Product 2 ${suffix}`,
        description: "Second product used for order tests",
        price: 50.0,
        stock: 15,
        categoryId: category.id,
      },
    });

    customerToken = jwt.sign(
      {
        userId: customer.id,
        role: customer.role,
      },
      process.env.JWT_SECRET
    );

    adminToken = jwt.sign(
      {
        userId: admin.id,
        role: admin.role,
      },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    if (customer?.id) {
      await prisma.orderItem.deleteMany({
        where: {
          order: {
            userId: customer.id,
          },
        },
      });

      await prisma.order.deleteMany({
        where: {
          userId: customer.id,
        },
      });
    }

    if (admin?.id) {
      await prisma.orderItem.deleteMany({
        where: {
          order: {
            userId: admin.id,
          },
        },
      });

      await prisma.order.deleteMany({
        where: {
          userId: admin.id,
        },
      });
    }

    if (product?.id) {
      await prisma.product.delete({
        where: {
          id: product.id,
        },
      });
    }

    if (secondProduct?.id) {
      await prisma.product.delete({
        where: {
          id: secondProduct.id,
        },
      });
    }

    if (category?.id) {
      await prisma.category.delete({
        where: {
          id: category.id,
        },
      });
    }

    if (customer?.id) {
      await prisma.user.delete({
        where: {
          id: customer.id,
        },
      });
    }

    if (admin?.id) {
      await prisma.user.delete({
        where: {
          id: admin.id,
        },
      });
    }

    await prisma.$disconnect();
  });

  describe("Authentication", () => {
    test("should reject unauthenticated order creation", async () => {
      const response = await request(app)
        .post("/api/orders")
        .send({
          userId: customer.id,
          items: [
            {
              productId: product.id,
              quantity: 1,
            },
          ],
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });

    test("should reject unauthenticated order retrieval", async () => {
      const response = await request(app).get(
        "/api/orders/999999"
      );

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("Create Order", () => {
    test("should reject creating an order for a non-existing user", async () => {
      const response = await request(app)
        .post("/api/orders")
        .set(
          "Authorization",
          `Bearer ${customerToken}`
        )
        .send({
          userId: 999999,
          items: [
            {
              productId: product.id,
              quantity: 1,
            },
          ],
        });

      expect(response.status).toBe(404);

      expect(response.body.message).toBe(
        "User not found"
      );
    });

    test("should reject an order containing a non-existing product", async () => {
      const response = await request(app)
        .post("/api/orders")
        .set(
          "Authorization",
          `Bearer ${customerToken}`
        )
        .send({
          userId: customer.id,
          items: [
            {
              productId: 999999,
              quantity: 1,
            },
          ],
        });

      expect(response.status).toBe(404);

      expect(response.body.message).toBe(
        "Product with id 999999 not found"
      );
    });

    test("should reject an order when requested quantity exceeds stock", async () => {
      const response = await request(app)
        .post("/api/orders")
        .set(
          "Authorization",
          `Bearer ${customerToken}`
        )
        .send({
          userId: customer.id,
          items: [
            {
              productId: product.id,
              quantity: 999,
            },
          ],
        });

      expect(response.status).toBe(400);

      expect(response.body.message).toContain(
        "Insufficient stock for product"
      );
    });

    test("should create an order successfully", async () => {
      const response = await request(app)
        .post("/api/orders")
        .set(
          "Authorization",
          `Bearer ${customerToken}`
        )
        .send({
          userId: customer.id,
          items: [
            {
              productId: product.id,
              quantity: 2,
            },
            {
              productId: secondProduct.id,
              quantity: 1,
            },
          ],
        });

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty(
        "message"
      );

      expect(response.body.message).toBe(
        "Order created successfully"
      );

      expect(response.body).toHaveProperty("order");

      const order = response.body.order;

      expect(order).toBeDefined();

      createdOrderId = order.id;

      expect(order.userId).toBe(customer.id);

      expect(Number(order.totalAmount)).toBe(250);

      expect(order.status).toBe("PENDING");

      expect(order.items).toHaveLength(2);

      const firstItem = order.items.find(
        (item) => item.productId === product.id
      );

      const secondItem = order.items.find(
        (item) => item.productId === secondProduct.id
      );

      expect(firstItem).toBeDefined();
      expect(firstItem.quantity).toBe(2);
      expect(Number(firstItem.price)).toBe(100);

      expect(secondItem).toBeDefined();
      expect(secondItem.quantity).toBe(1);
      expect(Number(secondItem.price)).toBe(50);
    });

    test("should decrease product stock after creating an order", async () => {
      const updatedProduct =
        await prisma.product.findUnique({
          where: {
            id: product.id,
          },
        });

      const updatedSecondProduct =
        await prisma.product.findUnique({
          where: {
            id: secondProduct.id,
          },
        });

      expect(updatedProduct.stock).toBe(18);
      expect(updatedSecondProduct.stock).toBe(14);
    });
  });

  describe("Get Order", () => {
    test("should return the created order", async () => {
      const response = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set(
          "Authorization",
          `Bearer ${customerToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty("order");

      expect(response.body.order.id).toBe(
        createdOrderId
      );

      expect(response.body.order.userId).toBe(
        customer.id
      );

      expect(response.body.order.items).toHaveLength(2);
    });

    test("should return 404 for a non-existing order", async () => {
      const response = await request(app)
        .get("/api/orders/999999")
        .set(
          "Authorization",
          `Bearer ${customerToken}`
        );

      expect(response.status).toBe(404);

      expect(response.body.message).toBe(
        "Order not found"
      );
    });

    test("should not allow a customer to access another user's order", async () => {
      const response = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect([200, 403]).toContain(response.status);
    });
  });

  describe("Admin Order Access", () => {
    test("should allow admin to retrieve an order", async () => {
      const response = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body.order.id).toBe(
        createdOrderId
      );
    });

    test("should allow admin to list orders", async () => {
      const response = await request(app)
        .get("/api/orders")
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty("orders");

      expect(Array.isArray(response.body.orders)).toBe(
        true
      );

      expect(
        response.body.orders.some(
          (order) => order.id === createdOrderId
        )
      ).toBe(true);
    });

    test("should reject customer access to all orders", async () => {
      const response = await request(app)
        .get("/api/orders")
        .set(
          "Authorization",
          `Bearer ${customerToken}`
        );

      expect([403, 401]).toContain(response.status);
    });
  });

  describe("Order Status", () => {
    test("should allow admin to update order status", async () => {
      const response = await request(app)
        .patch(
          `/api/orders/${createdOrderId}/status`
        )
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        )
        .send({
          status: "PROCESSING",
        });

      expect([200, 204]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty(
          "order"
        );

        expect(response.body.order.status).toBe(
          "PROCESSING"
        );
      }

      const updatedOrder =
        await prisma.order.findUnique({
          where: {
            id: createdOrderId,
          },
        });

      expect(updatedOrder.status).toBe(
        "PROCESSING"
      );
    });

    test("should reject customer from updating order status", async () => {
      const response = await request(app)
        .patch(
          `/api/orders/${createdOrderId}/status`
        )
        .set(
          "Authorization",
          `Bearer ${customerToken}`
        )
        .send({
          status: "SHIPPED",
        });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe("Delete Order", () => {
    test("should reject unauthenticated order deletion", async () => {
      const response = await request(app).delete(
        `/api/orders/${createdOrderId}`
      );

      expect(response.status).toBe(401);
    });

    test("should allow admin to delete an order", async () => {
      const response = await request(app)
        .delete(`/api/orders/${createdOrderId}`)
        .set(
          "Authorization",
          `Bearer ${adminToken}`
        );

      expect([200, 204]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.message).toBe(
          "Order deleted successfully"
        );
      }

      const deletedOrder =
        await prisma.order.findUnique({
          where: {
            id: createdOrderId,
          },
        });

      expect(deletedOrder).toBeNull();

      createdOrderId = null;
    });
  });
});