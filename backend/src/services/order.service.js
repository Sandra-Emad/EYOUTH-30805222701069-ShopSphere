import prisma from "../config/prisma.js";

const getAllOrders = async (database = prisma) => {
  return database.order.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getOrderById = async (
  id,
  database = prisma,
  requestingUserId = null,
  requestingUserRole = null
) => {
  const orderId = Number(id);

  if (!Number.isInteger(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const order = await database.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (requestingUserRole !== "ADMIN") {
    const parsedUserId = Number(requestingUserId);

    if (
      !Number.isInteger(parsedUserId) ||
      order.userId !== parsedUserId
    ) {
      const error = new Error(
        "You are not allowed to view this order"
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return order;
};

const createOrder = async (
  { userId, items },
  database = prisma
) => {
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error(
      "Order must contain at least one item"
    );
    error.statusCode = 400;
    throw error;
  }

  const user = await database.user.findUnique({
    where: {
      id: parsedUserId,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  /*
   * Validate and normalize all order items first.
   */
  const normalizedItems = items.map((item) => {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(productId)) {
      const error = new Error("Invalid product ID");
      error.statusCode = 400;
      throw error;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      const error = new Error(
        "Product quantity must be a positive integer"
      );
      error.statusCode = 400;
      throw error;
    }

    return {
      productId,
      quantity,
    };
  });

  /*
   * Aggregate duplicate product IDs.
   *
   * Example:
   * [
   *   { productId: 1, quantity: 2 },
   *   { productId: 1, quantity: 3 }
   * ]
   *
   * becomes:
   * product 1 => quantity 5
   */
  const quantityByProduct = new Map();

  for (const item of normalizedItems) {
    const currentQuantity =
      quantityByProduct.get(item.productId) || 0;

    quantityByProduct.set(
      item.productId,
      currentQuantity + item.quantity
    );
  }

  const productIds = [
    ...quantityByProduct.keys(),
  ];

  const products = await database.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  const productMap = new Map(
    products.map((product) => [
      product.id,
      product,
    ])
  );

  /*
   * Validate every requested product and its stock.
   */
  for (const productId of productIds) {
    const product = productMap.get(productId);

    if (!product) {
      const error = new Error(
        `Product with id ${productId} not found`
      );
      error.statusCode = 404;
      throw error;
    }

    const requestedQuantity =
      quantityByProduct.get(productId);

    if (product.stock < requestedQuantity) {
      const error = new Error(
        `Insufficient stock for product: ${product.name}`
      );

      // The API contract expects 400 for insufficient stock.
      error.statusCode = 400;

      throw error;
    }
  }

  /*
   * Calculate total and prepare OrderItem data.
   *
   * Price is taken from the database, never from
   * the client request.
   */
  let totalAmount = 0;

  const orderItems = normalizedItems.map((item) => {
    const product = productMap.get(item.productId);

    const price = Number(product.price);

    totalAmount += price * item.quantity;

    return {
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
    };
  });

  /*
   * Create the order and decrease stock atomically.
   */
  const order = await database.$transaction(
    async (tx) => {
      /*
       * Re-check stock inside the transaction before
       * changing anything.
       *
       * This protects against stock changes between
       * the initial validation and the transaction.
       */
      for (const productId of productIds) {
        const requestedQuantity =
          quantityByProduct.get(productId);

        const currentProduct =
          await tx.product.findUnique({
            where: {
              id: productId,
            },
          });

        if (!currentProduct) {
          const error = new Error(
            `Product with id ${productId} not found`
          );
          error.statusCode = 404;
          throw error;
        }

        if (
          currentProduct.stock <
          requestedQuantity
        ) {
          const error = new Error(
            `Insufficient stock for product: ${currentProduct.name}`
          );

          error.statusCode = 400;

          throw error;
        }
      }

      /*
       * Create the order.
       */
      const createdOrder =
        await tx.order.create({
          data: {
            userId: parsedUserId,
            totalAmount: totalAmount.toFixed(2),
            items: {
              create: orderItems,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
          },
        });

      /*
       * Decrease each product's stock exactly once.
       */
      for (const productId of productIds) {
        const quantity =
          quantityByProduct.get(productId);

        const updated =
          await tx.product.updateMany({
            where: {
              id: productId,
              stock: {
                gte: quantity,
              },
            },
            data: {
              stock: {
                decrement: quantity,
              },
            },
          });

        if (updated.count !== 1) {
          const product =
            await tx.product.findUnique({
              where: {
                id: productId,
              },
            });

          const productName =
            product?.name ||
            `Product ${productId}`;

          const error = new Error(
            `Insufficient stock for product: ${productName}`
          );

          error.statusCode = 400;

          throw error;
        }
      }

      /*
       * Return the order again after stock updates,
       * so the response contains the final product data.
       */
      return tx.order.findUnique({
        where: {
          id: createdOrder.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }
  );

  return order;
};

const updateOrderStatus = async (
  id,
  status,
  database = prisma
) => {
  const orderId = Number(id);

  if (!Number.isInteger(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const allowedStatuses = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!allowedStatuses.includes(status)) {
    const error = new Error(
      "Invalid order status"
    );
    error.statusCode = 400;
    throw error;
  }

  const existingOrder =
    await database.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!existingOrder) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return database.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

const deleteOrder = async (
  id,
  database = prisma
) => {
  const orderId = Number(id);

  if (!Number.isInteger(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const existingOrder =
    await database.order.findUnique({
      where: {
        id: orderId,
      },
    });

  if (!existingOrder) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  await database.order.delete({
    where: {
      id: orderId,
    },
  });

  return {
    message: "Order deleted successfully",
  };
};

export default {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};