import { jest } from "@jest/globals";

import categoryService from "../../src/services/category.service.js";

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = categoryService;

describe("Category Service", () => {
  describe("getAllCategories", () => {
    test("should return all categories ordered by name ascending", async () => {
      const categories = [
        {
          id: 1,
          name: "Books",
          description: "Books category",
        },
        {
          id: 2,
          name: "Electronics",
          description: "Electronics category",
        },
      ];

      const database = {
        category: {
          findMany: jest.fn().mockResolvedValue(categories),
        },
      };

      const result = await getAllCategories(database);

      expect(result).toEqual(categories);

      expect(database.category.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: "asc",
        },
      });
    });
  });

  describe("getCategoryById", () => {
    test("should return category with products successfully", async () => {
      const category = {
        id: 1,
        name: "Electronics",
        description: "Electronics category",
        products: [
          {
            id: 10,
            name: "Laptop",
          },
        ],
      };

      const database = {
        category: {
          findUnique: jest.fn().mockResolvedValue(category),
        },
      };

      const result = await getCategoryById("1", database);

      expect(result).toEqual(category);

      expect(database.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        include: {
          products: true,
        },
      });
    });

    test("should reject when category does not exist", async () => {
      const database = {
        category: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      await expect(
        getCategoryById(999, database)
      ).rejects.toMatchObject({
        message: "Category not found",
        statusCode: 404,
      });

      expect(database.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
        include: {
          products: true,
        },
      });
    });
  });

  describe("createCategory", () => {
    test("should create a category successfully", async () => {
      const createdCategory = {
        id: 1,
        name: "Electronics",
        description: "Electronic products",
      };

      const database = {
        category: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(createdCategory),
        },
      };

      const result = await createCategory(
        {
          name: "  Electronics  ",
          description: "  Electronic products  ",
        },
        database
      );

      expect(result).toEqual(createdCategory);

      expect(database.category.findUnique).toHaveBeenCalledWith({
        where: {
          name: "Electronics",
        },
      });

      expect(database.category.create).toHaveBeenCalledWith({
        data: {
          name: "Electronics",
          description: "Electronic products",
        },
      });
    });

    test("should create a category with null description when description is missing", async () => {
      const createdCategory = {
        id: 2,
        name: "Books",
        description: null,
      };

      const database = {
        category: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(createdCategory),
        },
      };

      const result = await createCategory(
        {
          name: "  Books  ",
        },
        database
      );

      expect(result).toEqual(createdCategory);

      expect(database.category.create).toHaveBeenCalledWith({
        data: {
          name: "Books",
          description: null,
        },
      });
    });

    test("should reject duplicate category name", async () => {
      const existingCategory = {
        id: 1,
        name: "Electronics",
      };

      const database = {
        category: {
          findUnique: jest
            .fn()
            .mockResolvedValue(existingCategory),
          create: jest.fn(),
        },
      };

      await expect(
        createCategory(
          {
            name: "  Electronics  ",
            description: "Duplicate",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Category already exists",
        statusCode: 409,
      });

      expect(database.category.create).not.toHaveBeenCalled();
    });
  });

  describe("updateCategory", () => {
    test("should update a category successfully", async () => {
      const existingCategory = {
        id: 1,
        name: "Old Name",
        description: "Old description",
      };

      const updatedCategory = {
        id: 1,
        name: "New Name",
        description: "New description",
      };

      const database = {
        category: {
          findUnique: jest
            .fn()
            .mockResolvedValue(existingCategory),
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn().mockResolvedValue(updatedCategory),
        },
      };

      const result = await updateCategory(
        "1",
        {
          name: "  New Name  ",
          description: "  New description  ",
        },
        database
      );

      expect(result).toEqual(updatedCategory);

      expect(database.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(database.category.findFirst).toHaveBeenCalledWith({
        where: {
          name: "New Name",
          NOT: {
            id: 1,
          },
        },
      });

      expect(database.category.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          name: "New Name",
          description: "New description",
        },
      });
    });

    test("should update category with null description when description is missing", async () => {
      const existingCategory = {
        id: 1,
        name: "Old Name",
        description: "Old description",
      };

      const updatedCategory = {
        id: 1,
        name: "New Name",
        description: null,
      };

      const database = {
        category: {
          findUnique: jest
            .fn()
            .mockResolvedValue(existingCategory),
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn().mockResolvedValue(updatedCategory),
        },
      };

      const result = await updateCategory(
        1,
        {
          name: "New Name",
        },
        database
      );

      expect(result).toEqual(updatedCategory);

      expect(database.category.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          name: "New Name",
          description: null,
        },
      });
    });

    test("should reject when category does not exist", async () => {
      const database = {
        category: {
          findUnique: jest.fn().mockResolvedValue(null),
          findFirst: jest.fn(),
          update: jest.fn(),
        },
      };

      await expect(
        updateCategory(
          999,
          {
            name: "New Name",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Category not found",
        statusCode: 404,
      });

      expect(database.category.findFirst).not.toHaveBeenCalled();
      expect(database.category.update).not.toHaveBeenCalled();
    });

    test("should reject duplicate category name", async () => {
      const existingCategory = {
        id: 1,
        name: "Old Name",
      };

      const duplicateCategory = {
        id: 2,
        name: "Electronics",
      };

      const database = {
        category: {
          findUnique: jest
            .fn()
            .mockResolvedValue(existingCategory),
          findFirst: jest
            .fn()
            .mockResolvedValue(duplicateCategory),
          update: jest.fn(),
        },
      };

      await expect(
        updateCategory(
          1,
          {
            name: "  Electronics  ",
            description: "Updated",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Category already exists",
        statusCode: 409,
      });

      expect(database.category.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteCategory", () => {
    test("should delete an empty category successfully", async () => {
      const existingCategory = {
        id: 1,
        name: "Electronics",
        products: [],
      };

      const database = {
        category: {
          findUnique: jest
            .fn()
            .mockResolvedValue(existingCategory),
          delete: jest.fn().mockResolvedValue(existingCategory),
        },
      };

      const result = await deleteCategory("1", database);

      expect(result).toEqual({
        message: "Category deleted successfully",
      });

      expect(database.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        include: {
          products: true,
        },
      });

      expect(database.category.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    test("should reject when category does not exist", async () => {
      const database = {
        category: {
          findUnique: jest.fn().mockResolvedValue(null),
          delete: jest.fn(),
        },
      };

      await expect(
        deleteCategory(999, database)
      ).rejects.toMatchObject({
        message: "Category not found",
        statusCode: 404,
      });

      expect(database.category.delete).not.toHaveBeenCalled();
    });

    test("should reject deleting a category that contains products", async () => {
      const existingCategory = {
        id: 1,
        name: "Electronics",
        products: [
          {
            id: 10,
            name: "Laptop",
          },
        ],
      };

      const database = {
        category: {
          findUnique: jest
            .fn()
            .mockResolvedValue(existingCategory),
          delete: jest.fn(),
        },
      };

      await expect(
        deleteCategory(1, database)
      ).rejects.toMatchObject({
        message: "Cannot delete category that contains products",
        statusCode: 409,
      });

      expect(database.category.delete).not.toHaveBeenCalled();
    });
  });
});