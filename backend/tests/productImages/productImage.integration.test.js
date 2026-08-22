import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../../src/app.js";
import prisma from "../../src/config/test-prisma.js";

describe("Product Image API Integration", () => {
  let adminUser;
  let customerUser;
  let category;
  let product;
  let adminToken;
  let customerToken;

  beforeAll(async () => {
    const timestamp = Date.now();

    adminUser = await prisma.user.create({
      data: {
        name: `Product Image Admin ${timestamp}`,
        email: `product.image.admin.${timestamp}@example.com`,
        password: "hashed-password",
        role: "ADMIN",
      },
    });

    customerUser = await prisma.user.create({
      data: {
        name: `Product Image Customer ${timestamp}`,
        email: `product.image.customer.${timestamp}@example.com`,
        password: "hashed-password",
        role: "CUSTOMER",
      },
    });

    category = await prisma.category.create({
      data: {
        name: `Product Image Category ${timestamp}`,
        description:
          "Category for product image tests",
      },
    });

    product = await prisma.product.create({
      data: {
        name: `Product Image Test Product ${timestamp}`,
        description:
          "Product for product image integration tests",
        price: 100,
        stock: 20,
        categoryId: category.id,
      },
    });

    adminToken = jwt.sign(
      {
        id: adminUser.id,
        role: adminUser.role,
      },
      process.env.JWT_SECRET
    );

    customerToken = jwt.sign(
      {
        id: customerUser.id,
        role: customerUser.role,
      },
      process.env.JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.productImage.deleteMany({
      where: {
        productId: product.id,
      },
    });

    await prisma.product.deleteMany({
      where: {
        id: product.id,
      },
    });

    await prisma.category.deleteMany({
      where: {
        id: category.id,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            adminUser.id,
            customerUser.id,
          ],
        },
      },
    });

    await prisma.$disconnect();
  });

  test("should reject unauthenticated image upload", async () => {
    const response = await request(app)
      .post(
        `/api/product-images/${product.id}`
      );

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      message: "Authentication required",
    });
  });

  test("should reject customer from uploading product image", async () => {
    const response = await request(app)
      .post(
        `/api/product-images/${product.id}`
      )
      .set(
        "Authorization",
        `Bearer ${customerToken}`
      );

    expect(response.status).toBe(403);
  });

  test("should reject admin upload without image file", async () => {
    const response = await request(app)
      .post(
        `/api/product-images/${product.id}`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message:
        "Product image file is required",
    });
  });

  test("should return empty images for product", async () => {
    const response = await request(app)
      .get(
        `/api/product-images/${product.id}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(0);
    expect(response.body.images).toEqual([]);
  });

  test("should reject invalid product ID", async () => {
    const response = await request(app)
      .get(
        "/api/product-images/not-a-number"
      );

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Invalid product ID"
    );
  });

  test("should return 404 for non-existing product", async () => {
    const response = await request(app)
      .get(
        "/api/product-images/999999999"
      );

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Product not found"
    );
  });

  test("should reject deleting non-existing image", async () => {
    const response = await request(app)
      .delete(
        "/api/product-images/999999999"
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Product image not found"
    );
  });

  test("should upload a real image file, persist it, and serve it", async () => {
    const jpeg1x1 = Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9k=",
      "base64"
    );

    const response = await request(app)
      .post(`/api/product-images/${product.id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .field("altText", "Uploaded test image")
      .attach("image", jpeg1x1, {
        filename: "integration-test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.image.productId).toBe(product.id);
    expect(response.body.image.url).toMatch(
      /^\/uploads\/products\/.+\.jpg$/
    );

    const image = await prisma.productImage.findUnique({
      where: { id: response.body.image.id },
    });

    expect(image).not.toBeNull();

    const served = await request(app).get(image.url);
    expect(served.status).toBe(200);
    expect(served.headers["content-type"]).toMatch(/image\/jpeg/);

    const deleteResponse = await request(app)
      .delete(`/api/product-images/${image.id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(deleteResponse.status).toBe(200);
    expect(
      await prisma.productImage.findUnique({
        where: { id: image.id },
      })
    ).toBeNull();
  });

  test("should create an image record and return it", async () => {
    const image =
      await prisma.productImage.create({
        data: {
          url: "/uploads/products/test-image.jpg",
          altText: "Test product image",
          productId: product.id,
        },
      });

    expect(image).toMatchObject({
      productId: product.id,
      url: "/uploads/products/test-image.jpg",
      altText: "Test product image",
    });

    await prisma.productImage.delete({
      where: {
        id: image.id,
      },
    });
  });

  test("should get product images after creating one", async () => {
    await prisma.productImage.create({
      data: {
        url: "/uploads/products/get-test.jpg",
        altText: "Get test image",
        productId: product.id,
      },
    });

    const response = await request(app)
      .get(
        `/api/product-images/${product.id}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
    expect(response.body.images).toHaveLength(1);

    expect(
      response.body.images[0]
    ).toMatchObject({
      productId: product.id,
      url: "/uploads/products/get-test.jpg",
      altText: "Get test image",
    });

    await prisma.productImage.deleteMany({
      where: {
        productId: product.id,
      },
    });
  });

  test("should delete an existing product image as admin", async () => {
    const image =
      await prisma.productImage.create({
        data: {
          url: "/uploads/products/delete-test.jpg",
          altText: "Delete test image",
          productId: product.id,
        },
      });

    const response = await request(app)
      .delete(
        `/api/product-images/${image.id}`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.message
    ).toBe(
      "Product image deleted successfully"
    );

    const deleted =
      await prisma.productImage.findUnique({
        where: {
          id: image.id,
        },
      });

    expect(deleted).toBeNull();
  });

  test("should reject customer from deleting product image", async () => {
    const image =
      await prisma.productImage.create({
        data: {
          url: "/uploads/products/customer-delete-test.jpg",
          altText: "Customer delete test",
          productId: product.id,
        },
      });

    const response = await request(app)
      .delete(
        `/api/product-images/${image.id}`
      )
      .set(
        "Authorization",
        `Bearer ${customerToken}`
      );

    expect(response.status).toBe(403);

    await prisma.productImage.delete({
      where: {
        id: image.id,
      },
    });
  });
});