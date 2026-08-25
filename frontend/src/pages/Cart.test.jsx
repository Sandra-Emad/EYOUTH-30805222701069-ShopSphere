import {
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Cart from "./Cart";

vi.mock("../hooks/useCart", () => ({
  default: vi.fn(),
}));

import useCart from "../hooks/useCart";

const item = {
  id: 10,
  productId: 1,
  quantity: 2,
  product: {
    id: 1,
    name: "iPhone 15",
    price: 999,
    imageUrl: "https://example.com/phone.jpg",
  },
};

const renderCart = () =>
  render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  );

describe("Cart page", () => {
  it("shows loading state", () => {
    useCart.mockReturnValue({
      items: [],
      total: 0,
      loading: true,
      error: "",
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
    });

    renderCart();

    expect(
      screen.getByText("Loading your cart...")
    ).toBeInTheDocument();
  });

  it("shows empty cart state", () => {
    useCart.mockReturnValue({
      items: [],
      total: 0,
      loading: false,
      error: "",
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
    });

    renderCart();

    expect(
      screen.getByText("Your cart is empty")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Browse products",
      })
    ).toHaveAttribute("href", "/products");
  });

  it("renders cart items and totals", () => {
    useCart.mockReturnValue({
      items: [item],
      total: 1998,
      loading: false,
      error: "",
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
    });

    renderCart();

    expect(
      screen.getByText("iPhone 15")
    ).toBeInTheDocument();

    expect(screen.getByText("$999.00")).toBeInTheDocument();
    expect(screen.getAllByText("$1998.00")).toHaveLength(3);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls updateQuantity when increasing quantity", async () => {
    const updateQuantity = vi.fn();

    useCart.mockReturnValue({
      items: [item],
      total: 1998,
      loading: false,
      error: "",
      updateQuantity,
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
    });

    renderCart();

    await screen.getByRole("button", {
      name: "Increase quantity",
    }).click();

    expect(updateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it("removes item when decreasing quantity from one", async () => {
    const removeFromCart = vi.fn();

    useCart.mockReturnValue({
      items: [
        {
          ...item,
          quantity: 1,
        },
      ],
      total: 999,
      loading: false,
      error: "",
      updateQuantity: vi.fn(),
      removeFromCart,
      clearCart: vi.fn(),
    });

    renderCart();

    await screen.getByRole("button", {
      name: "Decrease quantity",
    }).click();

    expect(removeFromCart).toHaveBeenCalledWith(1);
  });

  it("calls removeFromCart when Remove is clicked", async () => {
    const removeFromCart = vi.fn();

    useCart.mockReturnValue({
      items: [item],
      total: 1998,
      loading: false,
      error: "",
      updateQuantity: vi.fn(),
      removeFromCart,
      clearCart: vi.fn(),
    });

    renderCart();

    await screen.getByRole("button", {
      name: "Remove",
    }).click();

    expect(removeFromCart).toHaveBeenCalledWith(1);
  });

  it("calls clearCart", async () => {
    const clearCart = vi.fn();

    useCart.mockReturnValue({
      items: [item],
      total: 1998,
      loading: false,
      error: "",
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart,
    });

    renderCart();

    await screen.getByRole("button", {
      name: "Clear cart",
    }).click();

    expect(clearCart).toHaveBeenCalledTimes(1);
  });

  it("shows cart errors", () => {
    useCart.mockReturnValue({
      items: [],
      total: 0,
      loading: false,
      error: "Unable to update your cart.",
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
    });

    renderCart();

    expect(
      screen.getByText("Unable to update your cart.")
    ).toBeInTheDocument();
  });
});