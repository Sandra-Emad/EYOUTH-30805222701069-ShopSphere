import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../../src/app.js";
import prisma from "../../src/config/test-prisma.js";

describe("Cart API Integration", () => {
  let user;
  let product;
  let category;
  let token;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        name: `Cart Integration User ${Date.now()}`,
        email: `cart.integration.${Date.now()}@example.com`,
        password: "hashed-password",
        role: "CUSTOMER",
      },
    });

    category = await prisma.category.create({
      data: {
        name: `Cart Integration Category ${Date.now()}`,
      },
    });

    product = await prisma.product.create({
      data: {
        name: `Cart Integration Product ${Date.now()}`,
        description: "Cart integration test product",
        price: 100,
        stock: 20,
        categoryId: category.id,
      },
    });

    token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    try {
      /*
       * Cleanup order matters because of foreign-key constraints:
       *
       * CartItem -> Cart
       * CartItem -> Product
       * Product  -> Category
       */

      // 1. Remove cart items belonging to this user's cart.
      if (user?.id) {
        await prisma.cartItem.deleteMany({
          where: {
            cart: {
              userId: user.id,
            },
          },
        });
      }

      // 2. Remove the user's cart.
      if (user?.id) {
        await prisma.cart.deleteMany({
          where: {
            userId: user.id,
          },
        });
      }

      // 3. Remove the test product.
      if (product?.id) {
        await prisma.product.deleteMany({
          where: {
            id: product.id,
          },
        });
      }

      // 4. Only now is it safe to remove the test category.
      if (category?.id) {
        await prisma.category.deleteMany({
          where: {
            id: category.id,
          },
        });
      }

      // 5. Finally remove the test user.
      if (user?.id) {
        await prisma.user.deleteMany({
          where: {
            id: user.id,
          },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  test("should reject unauthenticated cart access", async () => {
    const response = await request(app).get("/api/cart");

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      message: "Authentication required",
    });
  });

  test("should get an empty cart for authenticated user", async () => {
    const response = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cart).toBeDefined();
    expect(response.body.cart.items).toEqual([]);
  });

  test("should add a product to the cart", async () => {
    const response = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product.id,
        quantity: 2,
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cart).toBeDefined();
    expect(response.body.cart.items).toHaveLength(1);

    expect(response.body.cart.items[0]).toMatchObject({
      productId: product.id,
      quantity: 2,
    });
  });

  test("should update the cart item quantity", async () => {
    const response = await request(app)
      .patch(`/api/cart/items/${product.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 5,
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cart.items).toHaveLength(1);

    expect(response.body.cart.items[0]).toMatchObject({
      productId: product.id,
      quantity: 5,
    });
  });

  test("should remove the cart item", async () => {
    const response = await request(app)
      .delete(`/api/cart/items/${product.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cart.items).toEqual([]);
  });

  test("should clear the cart", async () => {
    const addResponse = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: product.id,
        quantity: 1,
      });

    expect(addResponse.status).toBe(200);

    const response = await request(app)
      .delete("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.cart.items).toEqual([]);
  });
});