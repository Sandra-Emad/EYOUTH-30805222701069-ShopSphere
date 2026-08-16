import { jest } from "@jest/globals";
import cartService from "../../src/services/cart.service.js";

describe("Cart Service", () => {
  const createDatabaseMock = () => {
    const database = {
      cart: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },

      cartItem: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },

      product: {
        findUnique: jest.fn(),
      },
    };

    return database;
  };

  const createCart = (overrides = {}) => ({
    id: 1,
    userId: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  });

  const createProduct = (overrides = {}) => ({
    id: 5,
    name: "Test Product",
    description: "Test product description",
    price: "100.00",
    stock: 10,
    imageUrl: null,
    categoryId: 1,
    category: {
      id: 1,
      name: "Test Category",
      description: null,
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exports", () => {
    test("should export all required methods", () => {
      expect(cartService).toBeDefined();

      expect(typeof cartService.getCart).toBe("function");
      expect(typeof cartService.addToCart).toBe("function");
      expect(typeof cartService.updateCartItem).toBe("function");
      expect(typeof cartService.removeFromCart).toBe("function");
      expect(typeof cartService.clearCart).toBe("function");
    });
  });

  describe("getCart", () => {
    test("should return an existing cart with normalized totals", async () => {
      const database = createDatabaseMock();

      database.cart.findUnique.mockResolvedValue(
        createCart({
          items: [
            {
              id: 1,
              cartId: 1,
              productId: 5,
              quantity: 2,
              product: createProduct({
                price: "100.00",
              }),
            },
          ],
        })
      );

      const result = await cartService.getCart(10, database);

      expect(database.cart.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 10,
          },
        })
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].product.price).toBe("100.00");
      expect(result.items[0].subtotal).toBe("200.00");
      expect(result.total).toBe("200.00");
    });

    test("should create a cart when the user does not have one", async () => {
      const database = createDatabaseMock();

      database.cart.findUnique.mockResolvedValue(null);

      database.cart.create.mockResolvedValue(
        createCart()
      );

      const result = await cartService.getCart(10, database);

      expect(database.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            userId: 10,
          },
          include: {
            items: {
              orderBy: {
                id: "asc",
              },
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        })
      );

      expect(result.id).toBe(1);
      expect(result.userId).toBe(10);
      expect(result.items).toEqual([]);
      expect(result.total).toBe("0.00");
    });

    test("should reject an invalid user ID", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.getCart("abc", database)
      ).rejects.toMatchObject({
        message: "Invalid user ID",
        statusCode: 400,
      });

      expect(database.cart.findUnique).not.toHaveBeenCalled();
    });

    test("should calculate multiple item subtotals and the total", async () => {
      const database = createDatabaseMock();

      database.cart.findUnique.mockResolvedValue(
        createCart({
          items: [
            {
              id: 1,
              cartId: 1,
              productId: 5,
              quantity: 2,
              product: createProduct({
                id: 5,
                price: "100.00",
              }),
            },
            {
              id: 2,
              cartId: 1,
              productId: 6,
              quantity: 3,
              product: createProduct({
                id: 6,
                name: "Second Product",
                price: "50.00",
              }),
            },
          ],
        })
      );

      const result = await cartService.getCart(10, database);

      expect(result.items[0].subtotal).toBe("200.00");
      expect(result.items[1].subtotal).toBe("150.00");
      expect(result.total).toBe("350.00");
    });
  });

  describe("addToCart", () => {
    test("should add a new product to an existing cart", async () => {
      const database = createDatabaseMock();

      const product = createProduct({
        id: 5,
        stock: 10,
      });

      const cart = createCart();

      database.product.findUnique.mockResolvedValue(product);

      database.cart.findUnique
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(
          createCart({
            items: [
              {
                id: 1,
                cartId: 1,
                productId: 5,
                quantity: 2,
                product,
              },
            ],
          })
        );

      database.cartItem.findUnique.mockResolvedValue(null);

      database.cartItem.create.mockResolvedValue({
        id: 1,
        cartId: 1,
        productId: 5,
        quantity: 2,
      });

      const result = await cartService.addToCart(
        10,
        5,
        2,
        database
      );

      expect(database.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 1,
          productId: 5,
          quantity: 2,
        },
      });

      expect(result.items[0].quantity).toBe(2);
    });

    test("should create a cart when the user does not have one", async () => {
      const database = createDatabaseMock();

      const product = createProduct({
        id: 5,
        stock: 10,
      });

      database.product.findUnique.mockResolvedValue(product);

      database.cart.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          createCart({
            items: [],
          })
        );

      database.cart.create.mockResolvedValue(
        createCart()
      );

      database.cartItem.findUnique.mockResolvedValue(null);

      database.cartItem.create.mockResolvedValue({
        id: 1,
        cartId: 1,
        productId: 5,
        quantity: 1,
      });

      await cartService.addToCart(
        10,
        5,
        1,
        database
      );

      expect(database.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            userId: 10,
          },
        })
      );

      expect(database.cartItem.create).toHaveBeenCalled();
    });

    test("should reject an invalid user ID", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.addToCart(
          "abc",
          5,
          1,
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid user ID",
        statusCode: 400,
      });
    });

    test("should reject an invalid product ID", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.addToCart(
          10,
          "abc",
          1,
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid product ID",
        statusCode: 400,
      });
    });

    test("should reject a quantity less than 1", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.addToCart(
          10,
          5,
          0,
          database
        )
      ).rejects.toMatchObject({
        message: "Quantity must be a positive integer",
        statusCode: 400,
      });
    });

    test("should reject a non-integer quantity", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.addToCart(
          10,
          5,
          1.5,
          database
        )
      ).rejects.toMatchObject({
        message: "Quantity must be a positive integer",
        statusCode: 400,
      });
    });

    test("should reject when the product does not exist", async () => {
      const database = createDatabaseMock();

      database.product.findUnique.mockResolvedValue(null);

      await expect(
        cartService.addToCart(
          10,
          999,
          1,
          database
        )
      ).rejects.toMatchObject({
        message: "Product not found",
        statusCode: 404,
      });
    });

    test("should reject when requested quantity exceeds stock", async () => {
      const database = createDatabaseMock();

      database.product.findUnique.mockResolvedValue(
        createProduct({
          stock: 2,
        })
      );

      await expect(
        cartService.addToCart(
          10,
          5,
          3,
          database
        )
      ).rejects.toMatchObject({
        message:
          "Insufficient stock for product: Test Product",
        statusCode: 409,
      });
    });

    test("should increase quantity when the product already exists in the cart", async () => {
      const database = createDatabaseMock();

      const product = createProduct({
        id: 5,
        stock: 10,
      });

      const cart = createCart();

      database.product.findUnique.mockResolvedValue(product);

      database.cart.findUnique
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(
          createCart({
            items: [
              {
                id: 20,
                cartId: 1,
                productId: 5,
                quantity: 5,
                product,
              },
            ],
          })
        );

      database.cartItem.findUnique.mockResolvedValue({
        id: 20,
        cartId: 1,
        productId: 5,
        quantity: 3,
      });

      database.cartItem.update.mockResolvedValue({
        id: 20,
        cartId: 1,
        productId: 5,
        quantity: 5,
      });

      await cartService.addToCart(
        10,
        5,
        2,
        database
      );

      expect(database.cartItem.update).toHaveBeenCalledWith({
        where: {
          id: 20,
        },
        data: {
          quantity: 5,
        },
      });
    });

    test("should reject when adding existing quantity exceeds stock", async () => {
      const database = createDatabaseMock();

      const product = createProduct({
        id: 5,
        stock: 5,
      });

      database.product.findUnique.mockResolvedValue(product);

      database.cart.findUnique.mockResolvedValue(
        createCart()
      );

      database.cartItem.findUnique.mockResolvedValue({
        id: 20,
        cartId: 1,
        productId: 5,
        quantity: 4,
      });

      await expect(
        cartService.addToCart(
          10,
          5,
          2,
          database
        )
      ).rejects.toMatchObject({
        message:
          "Insufficient stock for product: Test Product",
        statusCode: 409,
      });

      expect(database.cartItem.update).not.toHaveBeenCalled();
    });
  });

  describe("updateCartItem", () => {
    test("should update the quantity of an existing cart item", async () => {
      const database = createDatabaseMock();

      const product = createProduct({
        id: 5,
        stock: 10,
      });

      database.product.findUnique.mockResolvedValue(product);

      database.cart.findUnique
        .mockResolvedValueOnce(
          createCart()
        )
        .mockResolvedValueOnce(
          createCart({
            items: [
              {
                id: 20,
                cartId: 1,
                productId: 5,
                quantity: 4,
                product,
              },
            ],
          })
        );

      database.cartItem.findUnique.mockResolvedValue({
        id: 20,
        cartId: 1,
        productId: 5,
        quantity: 2,
      });

      database.cartItem.update.mockResolvedValue({
        id: 20,
        cartId: 1,
        productId: 5,
        quantity: 4,
      });

      const result =
        await cartService.updateCartItem(
          10,
          5,
          4,
          database
        );

      expect(database.cartItem.update).toHaveBeenCalledWith({
        where: {
          id: 20,
        },
        data: {
          quantity: 4,
        },
      });

      expect(result.items[0].quantity).toBe(4);
    });

    test("should reject an invalid user ID", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.updateCartItem(
          "abc",
          5,
          2,
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid user ID",
        statusCode: 400,
      });
    });

    test("should reject an invalid product ID", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.updateCartItem(
          10,
          "abc",
          2,
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid product ID",
        statusCode: 400,
      });
    });

    test("should reject an invalid quantity", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.updateCartItem(
          10,
          5,
          0,
          database
        )
      ).rejects.toMatchObject({
        message: "Quantity must be a positive integer",
        statusCode: 400,
      });
    });

    test("should reject when the product does not exist", async () => {
      const database = createDatabaseMock();

      database.product.findUnique.mockResolvedValue(null);

      await expect(
        cartService.updateCartItem(
          10,
          999,
          2,
          database
        )
      ).rejects.toMatchObject({
        message: "Product not found",
        statusCode: 404,
      });
    });

    test("should reject when quantity exceeds stock", async () => {
      const database = createDatabaseMock();

      database.product.findUnique.mockResolvedValue(
        createProduct({
          stock: 2,
        })
      );

      await expect(
        cartService.updateCartItem(
          10,
          5,
          3,
          database
        )
      ).rejects.toMatchObject({
        message:
          "Insufficient stock for product: Test Product",
        statusCode: 409,
      });
    });

    test("should reject when the cart does not exist", async () => {
      const database = createDatabaseMock();

      database.product.findUnique.mockResolvedValue(
        createProduct()
      );

      database.cart.findUnique.mockResolvedValue(null);

      await expect(
        cartService.updateCartItem(
          10,
          5,
          2,
          database
        )
      ).rejects.toMatchObject({
        message: "Cart not found",
        statusCode: 404,
      });
    });

    test("should reject when the cart item does not exist", async () => {
      const database = createDatabaseMock();

      database.product.findUnique.mockResolvedValue(
        createProduct()
      );

      database.cart.findUnique.mockResolvedValue(
        createCart()
      );

      database.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        cartService.updateCartItem(
          10,
          5,
          2,
          database
        )
      ).rejects.toMatchObject({
        message: "Cart item not found",
        statusCode: 404,
      });
    });
  });

  describe("removeFromCart", () => {
    test("should remove an existing cart item", async () => {
      const database = createDatabaseMock();

      database.cart.findUnique
        .mockResolvedValueOnce(
          createCart()
        )
        .mockResolvedValueOnce(
          createCart({
            items: [],
          })
        );

      database.cartItem.findUnique.mockResolvedValue({
        id: 20,
        cartId: 1,
        productId: 5,
        quantity: 2,
      });

      database.cartItem.delete.mockResolvedValue({
        id: 20,
      });

      const result =
        await cartService.removeFromCart(
          10,
          5,
          database
        );

      expect(database.cartItem.delete).toHaveBeenCalledWith({
        where: {
          id: 20,
        },
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe("0.00");
    });

    test("should reject an invalid user ID", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.removeFromCart(
          "abc",
          5,
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid user ID",
        statusCode: 400,
      });
    });

    test("should reject an invalid product ID", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.removeFromCart(
          10,
          "abc",
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid product ID",
        statusCode: 400,
      });
    });

    test("should reject when the cart does not exist", async () => {
      const database = createDatabaseMock();

      database.cart.findUnique.mockResolvedValue(null);

      await expect(
        cartService.removeFromCart(
          10,
          5,
          database
        )
      ).rejects.toMatchObject({
        message: "Cart not found",
        statusCode: 404,
      });
    });

    test("should reject when the cart item does not exist", async () => {
      const database = createDatabaseMock();

      database.cart.findUnique.mockResolvedValue(
        createCart()
      );

      database.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        cartService.removeFromCart(
          10,
          5,
          database
        )
      ).rejects.toMatchObject({
        message: "Cart item not found",
        statusCode: 404,
      });
    });
  });

  describe("clearCart", () => {
    test("should remove all items from an existing cart", async () => {
      const database = createDatabaseMock();

      database.cart.findUnique
        .mockResolvedValueOnce(
          createCart()
        )
        .mockResolvedValueOnce(
          createCart({
            items: [],
          })
        );

      database.cartItem.deleteMany.mockResolvedValue({
        count: 2,
      });

      const result =
        await cartService.clearCart(
          10,
          database
        );

      expect(database.cartItem.deleteMany).toHaveBeenCalledWith({
        where: {
          cartId: 1,
        },
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe("0.00");
    });

    test("should work when the cart does not exist", async () => {
      const database = createDatabaseMock();

      database.cart.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          createCart()
        );

      const result =
        await cartService.clearCart(
          10,
          database
        );

      expect(database.cartItem.deleteMany).not.toHaveBeenCalled();
      expect(result.items).toEqual([]);
      expect(result.total).toBe("0.00");
    });

    test("should reject an invalid user ID", async () => {
      const database = createDatabaseMock();

      await expect(
        cartService.clearCart(
          "abc",
          database
        )
      ).rejects.toMatchObject({
        message: "Invalid user ID",
        statusCode: 400,
      });
    });
  });
});