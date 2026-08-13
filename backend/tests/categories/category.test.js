import request from "supertest";
import app from "../../src/app.js";
import testPrisma from "../../src/config/test-prisma.js";

describe("Category API", () => {
  const categoryName = `Test Category ${Date.now()}`;

  let categoryId;

  beforeAll(async () => {
    await testPrisma.$connect();
  });

  afterAll(async () => {
    await testPrisma.category.deleteMany({
      where: {
        name: {
          startsWith: "Test Category",
        },
      },
    });

  });

  test("should create a category successfully", async () => {
    const response = await request(app)
      .post("/api/categories")
      .send({
        name: categoryName,
        description: "Test category description",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.message).toBe(
      "Category created successfully"
    );

    expect(response.body.category.name).toBe(categoryName);

    categoryId = response.body.category.id;
  });

  test("should get all categories", async () => {
    const response = await request(app).get(
      "/api/categories"
    );

    expect(response.statusCode).toBe(200);

    expect(Array.isArray(response.body.categories)).toBe(true);
  });

  test("should get category by id", async () => {
    const response = await request(app).get(
      `/api/categories/${categoryId}`
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.category.id).toBe(categoryId);
  });

  test("should update a category", async () => {
    const response = await request(app)
      .put(`/api/categories/${categoryId}`)
      .send({
        name: `${categoryName} Updated`,
        description: "Updated description",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Category updated successfully"
    );

    expect(response.body.category.name).toBe(
      `${categoryName} Updated`
    );
  });

  test("should reject duplicate category names", async () => {
    const response = await request(app)
      .post("/api/categories")
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

  test("should delete a category successfully", async () => {
    const response = await request(app).delete(
      `/api/categories/${categoryId}`
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe(
      "Category deleted successfully"
    );
  });
});