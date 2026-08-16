import prisma from "../config/prisma.js";

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  },
};

const normalizeCart = (cart) => {
  if (!cart) {
    return cart;
  }

  const items = cart.items.map((item) => {
    const price = Number(item.product.price);
    const subtotal = price * item.quantity;

    return {
      ...item,
      product: {
        ...item.product,
        price: item.product.price?.toString(),
      },
      subtotal: subtotal.toFixed(2),
    };
  });

  const total = items.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0
  );

  return {
    ...cart,
    items,
    total: total.toFixed(2),
  };
};

const getOrCreateCart = async (userId, database = prisma) => {
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  let cart = await database.cart.findUnique({
    where: {
      userId: parsedUserId,
    },
    include: cartInclude,
  });

  if (!cart) {
    cart = await database.cart.create({
      data: {
        userId: parsedUserId,
      },
      include: cartInclude,
    });
  }

  return normalizeCart(cart);
};

const getCart = async (userId, database = prisma) => {
  return getOrCreateCart(userId, database);
};

const addToCart = async (
  userId,
  productId,
  quantity = 1,
  database = prisma
) => {
  const parsedUserId = Number(userId);
  const parsedProductId = Number(productId);
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedUserId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(parsedProductId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
    const error = new Error("Quantity must be a positive integer");
    error.statusCode = 400;
    throw error;
  }

  const product = await database.product.findUnique({
    where: {
      id: parsedProductId,
    },
  });

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (product.stock < parsedQuantity) {
    const error = new Error(
      `Insufficient stock for product: ${product.name}`
    );
    error.statusCode = 409;
    throw error;
  }

  let cart = await database.cart.findUnique({
    where: {
      userId: parsedUserId,
    },
  });

  if (!cart) {
    cart = await database.cart.create({
      data: {
        userId: parsedUserId,
      },
    });
  }

  const existingItem = await database.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: parsedProductId,
      },
    },
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + parsedQuantity;

    if (newQuantity > product.stock) {
      const error = new Error(
        `Insufficient stock for product: ${product.name}`
      );
      error.statusCode = 409;
      throw error;
    }

    await database.cartItem.update({
      where: {
        id: existingItem.id,
      },
      data: {
        quantity: newQuantity,
      },
    });
  } else {
    await database.cartItem.create({
      data: {
        cartId: cart.id,
        productId: parsedProductId,
        quantity: parsedQuantity,
      },
    });
  }

  return getCart(parsedUserId, database);
};

const updateCartItem = async (
  userId,
  productId,
  quantity,
  database = prisma
) => {
  const parsedUserId = Number(userId);
  const parsedProductId = Number(productId);
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedUserId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(parsedProductId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
    const error = new Error("Quantity must be a positive integer");
    error.statusCode = 400;
    throw error;
  }

  const product = await database.product.findUnique({
    where: {
      id: parsedProductId,
    },
  });

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (parsedQuantity > product.stock) {
    const error = new Error(
      `Insufficient stock for product: ${product.name}`
    );
    error.statusCode = 409;
    throw error;
  }

  const cart = await database.cart.findUnique({
    where: {
      userId: parsedUserId,
    },
  });

  if (!cart) {
    const error = new Error("Cart not found");
    error.statusCode = 404;
    throw error;
  }

  const cartItem = await database.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: parsedProductId,
      },
    },
  });

  if (!cartItem) {
    const error = new Error("Cart item not found");
    error.statusCode = 404;
    throw error;
  }

  await database.cartItem.update({
    where: {
      id: cartItem.id,
    },
    data: {
      quantity: parsedQuantity,
    },
  });

  return getCart(parsedUserId, database);
};

const removeFromCart = async (
  userId,
  productId,
  database = prisma
) => {
  const parsedUserId = Number(userId);
  const parsedProductId = Number(productId);

  if (!Number.isInteger(parsedUserId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(parsedProductId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  const cart = await database.cart.findUnique({
    where: {
      userId: parsedUserId,
    },
  });

  if (!cart) {
    const error = new Error("Cart not found");
    error.statusCode = 404;
    throw error;
  }

  const cartItem = await database.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: parsedProductId,
      },
    },
  });

  if (!cartItem) {
    const error = new Error("Cart item not found");
    error.statusCode = 404;
    throw error;
  }

  await database.cartItem.delete({
    where: {
      id: cartItem.id,
    },
  });

  return getCart(parsedUserId, database);
};

const clearCart = async (userId, database = prisma) => {
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  const cart = await database.cart.findUnique({
    where: {
      userId: parsedUserId,
    },
  });

  if (!cart) {
    return getCart(parsedUserId, database);
  }

  await database.cartItem.deleteMany({
    where: {
      cartId: cart.id,
    },
  });

  return getCart(parsedUserId, database);
};

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
