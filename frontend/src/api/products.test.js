import { describe, expect, it } from "vitest";

import {
  getProductById,
  getProducts,
} from "./products";

describe("Products API", () => {
  it("gets all products", async () => {
    const result = await getProducts();

    expect(result).toHaveProperty("products");
    expect(result.products).toHaveLength(3);

    expect(result.products[0]).toMatchObject({
      id: 1,
      name: "iPhone 15",
      price: 999,
    });
  });

  it("gets products using search parameters", async () => {
    const result = await getProducts({
      search: "iphone",
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe("iPhone 15");
  });

  it("gets a product by id", async () => {
    const product = await getProductById(1);

    expect(product).toMatchObject({
      id: 1,
      name: "iPhone 15",
      price: 999,
      stock: 10,
    });
  });

  it("throws when the requested product does not exist", async () => {
    await expect(
      getProductById(999)
    ).rejects.toThrow();
  });
});