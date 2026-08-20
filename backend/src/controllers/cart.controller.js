import cartService from "../services/cart.service.js";

const getDatabase = (req) => {
  return req.database;
};

const getAuthenticatedUserId = (req) => {
  return req.user.userId;
};

export const get = async (req, res) => {
  try {
    const cart = await cartService.getCart(
      getAuthenticatedUserId(req),
      getDatabase(req)
    );

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Get cart error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to get cart",
    });
  }
};

export const add = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await cartService.addToCart(
      getAuthenticatedUserId(req),
      productId,
      quantity,
      getDatabase(req)
    );

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Failed to add item to cart",
    });
  }
};

export const update = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItem(
      getAuthenticatedUserId(req),
      productId,
      quantity,
      getDatabase(req)
    );

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Update cart error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Failed to update cart item",
    });
  }
};

export const remove = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await cartService.removeFromCart(
      getAuthenticatedUserId(req),
      productId,
      getDatabase(req)
    );

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error(
      "Remove cart item error:",
      error.message
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Failed to remove cart item",
    });
  }
};

export const clear = async (req, res) => {
  try {
    const cart = await cartService.clearCart(
      getAuthenticatedUserId(req),
      getDatabase(req)
    );

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Failed to clear cart",
    });
  }
};

export default {
  get,
  add,
  update,
  remove,
  clear,
};