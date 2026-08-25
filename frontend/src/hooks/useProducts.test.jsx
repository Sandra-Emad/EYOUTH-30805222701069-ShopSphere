import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  renderHook,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  useProduct,
  useProducts,
} from "./useProducts";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe("useProducts", () => {
  it("loads products from the API", async () => {
    const { result } = renderHook(
      () => useProducts(),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data.products).toHaveLength(3);

    expect(result.current.data.products[0]).toMatchObject({
      id: 1,
      name: "iPhone 15",
    });
  });

  it("loads products with search parameters", async () => {
    const { result } = renderHook(
      () =>
        useProducts({
          search: "iphone",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data.products).toHaveLength(1);

    expect(
      result.current.data.products[0].name
    ).toBe("iPhone 15");
  });

  it("loads a product by id", async () => {
    const { result } = renderHook(
      () => useProduct(1),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      id: 1,
      name: "iPhone 15",
      price: 999,
    });
  });

  it("does not request a product when id is missing", () => {
    const { result } = renderHook(
      () => useProduct(null),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.isPending).toBe(true);
  });

  it("handles a product that does not exist", async () => {
    const { result } = renderHook(
      () => useProduct(999),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});