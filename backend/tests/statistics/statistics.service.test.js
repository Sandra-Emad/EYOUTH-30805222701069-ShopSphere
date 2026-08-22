import { jest } from "@jest/globals";

import {
  getStoreStatistics,
} from "../../src/services/statistics.service.js";

describe("Statistics Service", () => {
  test("should return complete store statistics", async () => {
    const database = {
      user: {
        count: jest.fn().mockResolvedValue(10),
      },

      product: {
        count: jest.fn().mockResolvedValue(20),
      },

      category: {
        count: jest.fn().mockResolvedValue(5),
      },

      order: {
        count: jest
          .fn()
          .mockResolvedValueOnce(50)
          .mockResolvedValueOnce(5)
          .mockResolvedValueOnce(10)
          .mockResolvedValueOnce(15)
          .mockResolvedValueOnce(18)
          .mockResolvedValueOnce(2),

        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            totalAmount: 15000,
          },
        }),
      },
    };

    const result = await getStoreStatistics(database);

    expect(result).toEqual({
      users: 10,
      products: 20,
      categories: 5,
      orders: 50,

      revenue: 15000,

      ordersByStatus: {
        pending: 5,
        processing: 10,
        shipped: 15,
        delivered: 18,
        cancelled: 2,
      },
    });
  });

  test("should return zero revenue when there are no orders", async () => {
    const database = {
      user: {
        count: jest.fn().mockResolvedValue(0),
      },

      product: {
        count: jest.fn().mockResolvedValue(0),
      },

      category: {
        count: jest.fn().mockResolvedValue(0),
      },

      order: {
        count: jest
          .fn()
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0),

        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            totalAmount: null,
          },
        }),
      },
    };

    const result = await getStoreStatistics(database);

    expect(result.users).toBe(0);
    expect(result.products).toBe(0);
    expect(result.categories).toBe(0);
    expect(result.orders).toBe(0);

    expect(result.revenue).toBe(0);

    expect(result.ordersByStatus).toEqual({
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    });
  });

  test("should count orders by every status", async () => {
    const database = {
      user: {
        count: jest.fn().mockResolvedValue(1),
      },

      product: {
        count: jest.fn().mockResolvedValue(1),
      },

      category: {
        count: jest.fn().mockResolvedValue(1),
      },

      order: {
        count: jest
          .fn()
          .mockResolvedValueOnce(20)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(3)
          .mockResolvedValueOnce(4)
          .mockResolvedValueOnce(5)
          .mockResolvedValueOnce(6),

        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            totalAmount: 5000,
          },
        }),
      },
    };

    const result = await getStoreStatistics(database);

    expect(result.orders).toBe(20);

    expect(result.ordersByStatus.pending).toBe(2);
    expect(result.ordersByStatus.processing).toBe(3);
    expect(result.ordersByStatus.shipped).toBe(4);
    expect(result.ordersByStatus.delivered).toBe(5);
    expect(result.ordersByStatus.cancelled).toBe(6);
  });

  test("should execute all required database queries", async () => {
    const database = {
      user: {
        count: jest.fn().mockResolvedValue(10),
      },

      product: {
        count: jest.fn().mockResolvedValue(20),
      },

      category: {
        count: jest.fn().mockResolvedValue(5),
      },

      order: {
        count: jest
          .fn()
          .mockResolvedValueOnce(50)
          .mockResolvedValueOnce(5)
          .mockResolvedValueOnce(10)
          .mockResolvedValueOnce(15)
          .mockResolvedValueOnce(18)
          .mockResolvedValueOnce(2),

        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            totalAmount: 15000,
          },
        }),
      },
    };

    await getStoreStatistics(database);

    expect(database.user.count).toHaveBeenCalledTimes(1);

    expect(database.product.count).toHaveBeenCalledTimes(1);

    expect(database.category.count).toHaveBeenCalledTimes(1);

    expect(database.order.count).toHaveBeenCalledTimes(6);

    expect(database.order.aggregate).toHaveBeenCalledTimes(1);
  });
});