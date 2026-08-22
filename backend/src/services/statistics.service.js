import prisma from "../config/prisma.js";

export const getStoreStatistics = async (
  database = prisma
) => {
  const [
    users,
    products,
    categories,
    orders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    revenueResult,
  ] = await Promise.all([
    database.user.count(),

    database.product.count(),

    database.category.count(),

    database.order.count(),

    database.order.count({
      where: {
        status: "PENDING",
      },
    }),

    database.order.count({
      where: {
        status: "PROCESSING",
      },
    }),

    database.order.count({
      where: {
        status: "SHIPPED",
      },
    }),

    database.order.count({
      where: {
        status: "DELIVERED",
      },
    }),

    database.order.count({
      where: {
        status: "CANCELLED",
      },
    }),

    database.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    }),
  ]);

  return {
    users,
    products,
    categories,
    orders,

    revenue: Number(
      revenueResult._sum.totalAmount || 0
    ),

    ordersByStatus: {
      pending: pendingOrders,
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
    },
  };
};

export default {
  getStoreStatistics,
};