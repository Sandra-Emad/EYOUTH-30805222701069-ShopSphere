import orderService from "../services/order.service.js";

/*
|--------------------------------------------------------------------------
| Create Order
|--------------------------------------------------------------------------
*/

export const create = async (req, res) => {
  try {
    const { items } = req.body;

    /*
     * Orders always belong to the authenticated user.
     * Never trust a userId supplied by the client.
     */
    const requestedUserId = req.user.userId;

    const order =
      await orderService.createOrder(
        {
          userId: requestedUserId,
          items,
        },
        req.database
      );

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      message:
        error.message ||
        "Failed to create order",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get My Orders
|--------------------------------------------------------------------------
*/

export const getMine = async (req, res) => {
  try {
    const orders =
      await orderService.getAllOrders(
        req.database
      );

    /*
     * getAllOrders currently returns all orders.
     * Filter them here for the authenticated customer.
     *
     * Admins can still use getAll through the admin route.
     */
    const userId = Number(req.user.userId);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const myOrders = orders.filter(
      (order) => order.userId === userId
    );

    return res.status(200).json({
      orders: myOrders,
    });
  } catch (error) {
    console.error(
      "Get my orders error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      message:
        error.message ||
        "Failed to get orders",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get All Orders - Admin
|--------------------------------------------------------------------------
*/

export const getAll = async (req, res) => {
  try {
    const orders =
      await orderService.getAllOrders(
        req.database
      );

    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error(
      "Get all orders error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      message:
        error.message ||
        "Failed to get orders",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get One Order
|--------------------------------------------------------------------------
*/

export const getOne = async (req, res) => {
  try {
    const order =
      await orderService.getOrderById(
        req.params.id,
        req.database,
        req.user.userId,
        req.user.role
      );

    return res.status(200).json({
      order,
    });
  } catch (error) {
    console.error(
      "Get order error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      message:
        error.message ||
        "Failed to get order",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Order Status - Admin
|--------------------------------------------------------------------------
*/

export const updateStatus = async (
  req,
  res
) => {
  try {
    const order =
      await orderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.database
      );

    return res.status(200).json({
      message:
        "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      message:
        error.message ||
        "Failed to update order status",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Cancel Order - Customer
|--------------------------------------------------------------------------
*/

export const cancel = async (req, res) => {
  try {
    /*
     * First verify that the authenticated user
     * owns the order.
     *
     * getOrderById performs the ownership check
     * for non-admin users.
     */
    const order =
      await orderService.getOrderById(
        req.params.id,
        req.database,
        req.user.userId,
        req.user.role
      );

    /*
     * Only pending orders should normally be
     * cancellable by the customer.
     */
    if (order.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Only pending orders can be cancelled",
      });
    }

    const cancelledOrder =
      await orderService.updateOrderStatus(
        req.params.id,
        "CANCELLED",
        req.database
      );

    return res.status(200).json({
      message:
        "Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error(
      "Cancel order error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      message:
        error.message ||
        "Failed to cancel order",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Backward Compatibility
|--------------------------------------------------------------------------
 *
 * These aliases preserve the names used by the
 * older controller implementation.
 */

export const getOrders = getAll;

export const getOrder = getOne;

export const createOrder = create;

export const updateOrderStatus = updateStatus;

export const deleteOrder = async (req, res) => {
  try {
    const result =
      await orderService.deleteOrder(
        req.params.id,
        req.database
      );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Delete order error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      message:
        error.message ||
        "Failed to delete order",
    });
  }
};