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

const getOrderById = async (id, database = prisma) => {
  const orderId = Number(id);

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

  return order;
};

const createOrder = async (
  { userId, items },
  database = prisma
) => {
  const parsedUserId = Number(userId);

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

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error(
      "Order must contain at least one item"
    );
    error.statusCode = 400;
    throw error;
  }

  const productIds = items.map((item) =>
    Number(item.productId)
  );

  const products = await database.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  const productMap = new Map(
    products.map((product) => [product.id, product])
  );

  for (const productId of productIds) {
    if (!productMap.has(productId)) {
      const error = new Error(
        `Product with id ${productId} not found`
      );
      error.statusCode = 404;
      throw error;
    }
  }

  let totalAmount = 0;

  const orderItems = items.map((item) => {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    const product = productMap.get(productId);

    if (!product) {
      const error = new Error(
        `Product with id ${productId} not found`
      );
      error.statusCode = 404;
      throw error;
    }

    if (
      quantity <= 0 ||
      !Number.isInteger(quantity)
    ) {
      const error = new Error(
        "Product quantity must be a positive integer"
      );
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < quantity) {
      const error = new Error(
        `Insufficient stock for product: ${product.name}`
      );
      error.statusCode = 409;
      throw error;
    }

    const price = Number(product.price);

    totalAmount += price * quantity;

    return {
      productId,
      quantity,
      price: product.price,
    };
  });

  const order = await database.$transaction(
    async (tx) => {
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

      for (const item of orderItems) {
        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return createdOrder;
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