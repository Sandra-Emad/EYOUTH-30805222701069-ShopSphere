import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
} from "@jest/globals";

import productService from "../../src/services/product.service.js";

describe("Product Service", () => {
  let database;

  beforeEach(() => {
    database = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
    };
  });

  describe("getAllProducts", () => {
    test("should return paginated products successfully", async () => {
      const products = [
        {
          id: 1,
          name: "Laptop",
          price: "1200",
          category: {
            id: 1,
            name: "Electronics",
          },
        },
      ];

      database.product.findMany.mockResolvedValue(products);
      database.product.count.mockResolvedValue(11);

      const result = await productService.getAllProducts(
        database,
        {
          page: 2,
          limit: 5,
        }
      );

      expect(database.product.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: 5,
        take: 5,
      });

      expect(database.product.count).toHaveBeenCalledWith({
        where: {},
      });

      expect(result.products).toEqual(products);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 11,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    test("should normalize Decimal price to string", async () => {
      database.product.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Phone",
          price: {
            toString: () => "999.99",
          },
          category: {
            id: 1,
            name: "Electronics",
          },
        },
      ]);

      database.product.count.mockResolvedValue(1);

      const result = await productService.getAllProducts(
        database
      );

      expect(result.products[0].price).toBe("999.99");
    });

    test("should apply search filter", async () => {
      database.product.findMany.mockResolvedValue([]);
      database.product.count.mockResolvedValue(0);

      await productService.getAllProducts(database, {
        search: "  laptop  ",
      });

      expect(database.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              {
                name: {
                  contains: "laptop",
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: "laptop",
                  mode: "insensitive",
                },
              },
            ],
          },
        })
      );
    });

    test("should apply category filter", async () => {
      database.product.findMany.mockResolvedValue([]);
      database.product.count.mockResolvedValue(0);

      await productService.getAllProducts(database, {
        categoryId: "3",
      });

      expect(database.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            categoryId: 3,
          },
        })
      );

      expect(database.product.count).toHaveBeenCalledWith({
        where: {
          categoryId: 3,
        },
      });
    });

    test("should reject invalid category ID", async () => {
      await expect(
        productService.getAllProducts(database, {
          categoryId: "abc",
        })
      ).rejects.toMatchObject({
        message: "Category ID must be a valid number",
        statusCode: 400,
      });

      expect(
        database.product.findMany
      ).not.toHaveBeenCalled();

      expect(
        database.product.count
      ).not.toHaveBeenCalled();
    });

    test("should use allowed sort field and ascending order", async () => {
      database.product.findMany.mockResolvedValue([]);
      database.product.count.mockResolvedValue(0);

      await productService.getAllProducts(database, {
        sortBy: "price",
        sortOrder: "asc",
      });

      expect(database.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            price: "asc",
          },
        })
      );
    });

    test("should fallback to createdAt for invalid sort field", async () => {
      database.product.findMany.mockResolvedValue([]);
      database.product.count.mockResolvedValue(0);

      await productService.getAllProducts(database, {
        sortBy: "invalidField",
        sortOrder: "invalidOrder",
      });

      expect(database.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });

    test("should clamp invalid page and limit values", async () => {
      database.product.findMany.mockResolvedValue([]);
      database.product.count.mockResolvedValue(0);

      const result =
        await productService.getAllProducts(database, {
          page: 0,
          limit: 1000,
        });

      expect(database.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 100,
        })
      );

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(100);
    });

    test("should return zero totalPages when there are no products", async () => {
      database.product.findMany.mockResolvedValue([]);
      database.product.count.mockResolvedValue(0);

      const result =
        await productService.getAllProducts(database);

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    test("should set hasPreviousPage false on first page", async () => {
      database.product.findMany.mockResolvedValue([]);
      database.product.count.mockResolvedValue(25);

      const result =
        await productService.getAllProducts(database, {
          page: 1,
          limit: 10,
        });

      expect(result.pagination.hasPreviousPage).toBe(false);
      expect(result.pagination.hasNextPage).toBe(true);
    });

    test("should set hasNextPage false on last page", async () => {
      database.product.findMany.mockResolvedValue([]);
      database.product.count.mockResolvedValue(20);

      const result =
        await productService.getAllProducts(database, {
          page: 2,
          limit: 10,
        });

      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });
  });

  describe("getProductById", () => {
    test("should return product successfully", async () => {
      const product = {
        id: 1,
        name: "Laptop",
        price: {
          toString: () => "1500",
        },
        category: {
          id: 1,
          name: "Electronics",
        },
      };

      database.product.findUnique.mockResolvedValue(product);

      const result =
        await productService.getProductById(
          "1",
          database
        );

      expect(database.product.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        include: {
          category: true,
        },
      });

      expect(result).toEqual({
        ...product,
        price: "1500",
      });
    });

    test("should reject invalid product ID", async () => {
      await expect(
        productService.getProductById(
          "abc",
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid product ID",
        statusCode: 400,
      });

      expect(
        database.product.findUnique
      ).not.toHaveBeenCalled();
    });

    test("should reject when product does not exist", async () => {
      database.product.findUnique.mockResolvedValue(null);

      await expect(
        productService.getProductById(
          999,
          database
        )
      ).rejects.toMatchObject({
        message: "Product not found",
        statusCode: 404,
      });
    });
  });

  describe("createProduct", () => {
    test("should create product successfully", async () => {
      const category = {
        id: 1,
        name: "Electronics",
      };

      const createdProduct = {
        id: 10,
        name: " Laptop ",
        description: " Great laptop ",
        price: "1500",
        stock: 5,
        imageUrl: "image.jpg",
        categoryId: 1,
        category,
      };

      database.product.findFirst.mockResolvedValue(null);
      database.category.findUnique.mockResolvedValue(category);
      database.product.create.mockResolvedValue(
        createdProduct
      );

      const result =
        await productService.createProduct(
          {
            name: " Laptop ",
            description: " Great laptop ",
            price: "1500",
            stock: "5",
            imageUrl: "image.jpg",
            categoryId: "1",
          },
          database
        );

      expect(database.product.findFirst).toHaveBeenCalledWith({
        where: {
          name: {
            equals: "Laptop",
            mode: "insensitive",
          },
        },
      });

      expect(database.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(database.product.create).toHaveBeenCalledWith({
        data: {
          name: "Laptop",
          description: "Great laptop",
          price: "1500",
          stock: 5,
          imageUrl: "image.jpg",
          categoryId: 1,
        },
        include: {
          category: true,
        },
      });

      expect(result).toEqual(createdProduct);
    });

    test("should reject duplicate product", async () => {
      database.product.findFirst.mockResolvedValue({
        id: 1,
        name: "Laptop",
      });

      await expect(
        productService.createProduct(
          {
            name: " Laptop ",
            price: "1000",
            stock: 2,
            categoryId: 1,
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Product already exists",
        statusCode: 409,
      });

      expect(
        database.category.findUnique
      ).not.toHaveBeenCalled();

      expect(
        database.product.create
      ).not.toHaveBeenCalled();
    });

    test("should reject when category does not exist", async () => {
      database.product.findFirst.mockResolvedValue(null);
      database.category.findUnique.mockResolvedValue(null);

      await expect(
        productService.createProduct(
          {
            name: "Laptop",
            price: "1000",
            stock: 2,
            categoryId: 999,
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Category not found",
        statusCode: 404,
      });

      expect(
        database.product.create
      ).not.toHaveBeenCalled();
    });

    test("should use default stock of zero", async () => {
      database.product.findFirst.mockResolvedValue(null);
      database.category.findUnique.mockResolvedValue({
        id: 1,
        name: "Electronics",
      });

      database.product.create.mockResolvedValue({
        id: 1,
        name: "Laptop",
        price: "1000",
        stock: 0,
      });

      await productService.createProduct(
        {
          name: "Laptop",
          price: "1000",
          categoryId: 1,
        },
        database
      );

      expect(database.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stock: 0,
          }),
        })
      );
    });
  });

  describe("updateProduct", () => {
    test("should update product successfully", async () => {
      const existingProduct = {
        id: 1,
        name: "Laptop",
        categoryId: 1,
      };

      const updatedProduct = {
        id: 1,
        name: "Gaming Laptop",
        description: "Updated",
        price: "2000",
        stock: 10,
        imageUrl: "new.jpg",
        categoryId: 2,
        category: {
          id: 2,
          name: "Gaming",
        },
      };

      database.product.findUnique
        .mockResolvedValueOnce(existingProduct);

      database.category.findUnique.mockResolvedValue({
        id: 2,
        name: "Gaming",
      });

      database.product.update.mockResolvedValue(
        updatedProduct
      );

      const result =
        await productService.updateProduct(
          1,
          {
            name: " Gaming Laptop ",
            description: " Updated ",
            price: "2000",
            stock: "10",
            imageUrl: "new.jpg",
            categoryId: "2",
          },
          database
        );

      expect(database.product.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          name: "Gaming Laptop",
          description: "Updated",
          price: "2000",
          stock: 10,
          imageUrl: "new.jpg",
          categoryId: 2,
        },
        include: {
          category: true,
        },
      });

      expect(result).toEqual(updatedProduct);
    });

    test("should reject invalid product ID", async () => {
      await expect(
        productService.updateProduct(
          "abc",
          {
            name: "Laptop",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid product ID",
        statusCode: 400,
      });
    });

    test("should reject when product does not exist", async () => {
      database.product.findUnique.mockResolvedValue(null);

      await expect(
        productService.updateProduct(
          999,
          {
            name: "Laptop",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Product not found",
        statusCode: 404,
      });
    });

    test("should reject duplicate product name", async () => {
      database.product.findUnique.mockResolvedValue({
        id: 1,
        name: "Laptop",
      });

      database.product.findFirst.mockResolvedValue({
        id: 2,
        name: "Gaming Laptop",
      });

      await expect(
        productService.updateProduct(
          1,
          {
            name: " Gaming Laptop ",
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Product already exists",
        statusCode: 409,
      });

      expect(
        database.product.update
      ).not.toHaveBeenCalled();
    });

    test("should allow keeping the same product name", async () => {
      const existingProduct = {
        id: 1,
        name: "Laptop",
      };

      database.product.findUnique.mockResolvedValue(
        existingProduct
      );

      database.product.update.mockResolvedValue({
        ...existingProduct,
        price: "1500",
      });

      await productService.updateProduct(
        1,
        {
          name: " LAPTOP ",
          price: "1500",
        },
        database
      );

      expect(
        database.product.findFirst
      ).not.toHaveBeenCalled();

      expect(
        database.product.update
      ).toHaveBeenCalled();
    });

    test("should reject when new category does not exist", async () => {
      database.product.findUnique.mockResolvedValue({
        id: 1,
        name: "Laptop",
      });

      database.category.findUnique.mockResolvedValue(null);

      await expect(
        productService.updateProduct(
          1,
          {
            categoryId: 999,
          },
          database
        )
      ).rejects.toMatchObject({
        message: "Category not found",
        statusCode: 404,
      });

      expect(
        database.product.update
      ).not.toHaveBeenCalled();
    });

    test("should update only provided fields", async () => {
      database.product.findUnique.mockResolvedValue({
        id: 1,
        name: "Laptop",
      });

      database.product.update.mockResolvedValue({
        id: 1,
        name: "Laptop",
        price: "1200",
      });

      await productService.updateProduct(
        1,
        {
          price: "1200",
        },
        database
      );

      expect(database.product.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          price: "1200",
        },
        include: {
          category: true,
        },
      });
    });
  });

  describe("deleteProduct", () => {
    test("should delete product successfully", async () => {
      database.product.findUnique.mockResolvedValue({
        id: 1,
        name: "Laptop",
      });

      database.product.delete.mockResolvedValue({
        id: 1,
      });

      const result =
        await productService.deleteProduct(
          1,
          database
        );

      expect(database.product.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(result).toEqual({
        message: "Product deleted successfully",
      });
    });

    test("should reject invalid product ID", async () => {
      await expect(
        productService.deleteProduct(
          "abc",
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid product ID",
        statusCode: 400,
      });
    });

    test("should reject when product does not exist", async () => {
      database.product.findUnique.mockResolvedValue(null);

      await expect(
        productService.deleteProduct(
          999,
          database
        )
      ).rejects.toMatchObject({
        message: "Product not found",
        statusCode: 404,
      });

      expect(
        database.product.delete
      ).not.toHaveBeenCalled();
    });
  }); 
});