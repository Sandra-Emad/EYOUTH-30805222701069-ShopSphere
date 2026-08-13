import orderService from "../services/order.service.js";

export const getOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders(
      req.database
    );

    res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to get orders",
    });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await orderService.getOrderById(
      req.params.id,
      req.database
    );

    res.status(200).json({
      order,
    });
  } catch (error) {
    console.error("Get order error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to get order",
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(
      req.body,
      req.database
    );

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to create order",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.database
    );

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message || "Failed to update order status",
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const result = await orderService.deleteOrder(
      req.params.id,
      req.database
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete order error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to delete order",
    });
  }
};