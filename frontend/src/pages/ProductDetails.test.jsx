import {
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProductDetails from "./ProductDetails";

vi.mock("../hooks/useProducts", () => ({
  useProduct: vi.fn(),
}));

vi.mock("../hooks/useAuth", () => ({
  default: vi.fn(),
}));

vi.mock("../hooks/useCart", () => ({
  default: vi.fn(),
}));

import { useProduct } from "../hooks/useProducts";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";

const product = {
  id: 1,
  name: "iPhone 15",
  price: 999,
  stock: 10,
  description: "Latest Apple smartphone",
  category: {
    name: "Phones",
  },
  imageUrl: "https://example.com/phone.jpg",
};

const renderDetails = () =>
  render(
    <MemoryRouter
      initialEntries={["/products/1"]}
    >
      <ProductDetails />
    </MemoryRouter>
  );

describe("ProductDetails", () => {
  it("shows loading state", () => {
    useProduct.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByText("Loading product...")
    ).toBeInTheDocument();
  });

  it("shows product information", () => {
    useProduct.mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByRole("heading", {
        name: "iPhone 15",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("$999.00")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Latest Apple smartphone")
    ).toBeInTheDocument();

    expect(
      screen.getByText("10 in stock")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Add to cart",
      })
    ).toBeEnabled();
  });

  it("shows out of stock state", () => {
    useProduct.mockReturnValue({
      data: {
        ...product,
        stock: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    const button = screen.getByRole("button", {
      name: "Out of stock",
    });

    expect(button).toBeDisabled();
  });

  it("shows error state", () => {
    useProduct.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        response: {
          data: {
            message: "Product not found",
          },
        },
      },
      refetch: vi.fn(),
    });

    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByText("Product not found")
    ).toBeInTheDocument();
  });

  it("shows not found state when product is null", () => {
    useProduct.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByText("Product not found")
    ).toBeInTheDocument();
  });
});