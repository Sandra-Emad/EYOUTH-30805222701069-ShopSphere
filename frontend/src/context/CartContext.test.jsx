import React from "react";

import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import AuthContext from "./AuthContext";
import CartContext, {
  CartProvider,
} from "./CartContext";

const authValue = {
  user: {
    id: 1,
    name: "Sandra",
    email: "sandra@example.com",
    role: "CUSTOMER",
  },
  initializing: false,
  isAuthenticated: true,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  getMe: async () => {},
};

const wrapper = ({ children }) => (
  <AuthContext.Provider value={authValue}>
    <CartProvider>{children}</CartProvider>
  </AuthContext.Provider>
);

const useCartContext = () =>
  React.useContext(CartContext);

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();

    localStorage.setItem(
      "token",
      "mock-customer-token"
    );
  });

  it("loads the authenticated user's cart", async () => {
    const { result } = renderHook(
      useCartContext,
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(
        2
      );
    });

    expect(result.current.itemCount).toBe(3);
    expect(result.current.total).toBe(3297);
  });

  it("adds a product to the cart", async () => {
    const { result } = renderHook(
      useCartContext,
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(
        2
      );
    });

    await act(async () => {
      await result.current.addToCart(3, 2);
    });

    expect(result.current.items).toHaveLength(
      3
    );

    expect(result.current.itemCount).toBe(5);
    expect(result.current.total).toBe(3795);
  });

  it("updates item quantity", async () => {
    const { result } = renderHook(
      useCartContext,
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(
        2
      );
    });

    await act(async () => {
      await result.current.updateQuantity(
        1,
        4
      );
    });

    const updatedItem =
      result.current.items.find(
        (item) => item.productId === 1
      );

    expect(updatedItem.quantity).toBe(4);
    expect(result.current.itemCount).toBe(5);
    expect(result.current.total).toBe(5295);
  });

  it("removes an item", async () => {
    const { result } = renderHook(
      useCartContext,
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(
        2
      );
    });

    await act(async () => {
      await result.current.removeFromCart(1);
    });

    expect(result.current.items).toHaveLength(
      1
    );

    expect(
      result.current.items[0].productId
    ).toBe(2);

    expect(result.current.itemCount).toBe(1);
    expect(result.current.total).toBe(1299);
  });

  it("clears the cart", async () => {
    const { result } = renderHook(
      useCartContext,
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(
        2
      );
    });

    await act(async () => {
      await result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(
      0
    );

    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it("does not load cart for unauthenticated users", () => {
    const unauthenticatedWrapper = ({
      children,
    }) => (
      <AuthContext.Provider
        value={{
          ...authValue,
          user: null,
          isAuthenticated: false,
        }}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(
      useCartContext,
      {
        wrapper: unauthenticatedWrapper,
      }
    );

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });
});