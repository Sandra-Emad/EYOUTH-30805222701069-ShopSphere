process.env.NODE_ENV = "test";

import request from "supertest";

import app from "../../src/app.js";
import testPrisma from "../../src/config/test-prisma.js";

describe("Product API", () => {
  let categoryId;
  let productId;

  const categoryName = `Test Product Category ${Date.now()}`;
  const productName = `Test Product ${Date.now()}`;

  beforeAll(async () => {
    await testPrisma.$connect();

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

  });

  test("should create a product successfully", async () => {
    const response = await request(app)
      .post("/api/products")
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

    expect(response.body.product.name).toBe(productName);

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

    expect(Array.isArray(response.body.products)).toBe(true);
  });

  test("should get product by id", async () => {
    const response = await request(app).get(
      `/api/products/${productId}`
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.product.id).toBe(productId);

    expect(response.body.product.name).toBe(productName);
  });

  test("should update a product", async () => {
    const updatedName = `${productName} Updated`;

    const response = await request(app)
      .put(`/api/products/${productId}`)
      .send({
        name: updatedName,
        description: "Updated product description",
        price: 149.99,
        stock: 20,
        imageUrl: "https://example.com/updated.jpg",
        categoryId,
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Product updated successfully"
    );

    expect(response.body.product.name).toBe(updatedName);

    expect(response.body.product.price).toBe("149.99");

    expect(response.body.product.stock).toBe(20);
  });

  test("should reject duplicate product names in the same category", async () => {
    const response = await request(app)
      .post("/api/products")
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

  test("should delete a product successfully", async () => {
    const response = await request(app).delete(
      `/api/products/${productId}`
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Product deleted successfully"
    );
  });
});