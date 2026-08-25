import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Home from "./Home";

vi.mock("../hooks/useProducts", () => ({
  useProducts: vi.fn(),
}));

vi.mock("../components/ProductCard", () => ({
  default: ({ product }) => (
    <article data-testid="product-card">
      {product.name}
    </article>
  ),
}));

import { useProducts } from "../hooks/useProducts";

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe("Home page", () => {
  it("renders hero content", () => {
    useProducts.mockReturnValue({
      data: {
        products: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderHome();

    expect(
      screen.getByRole("heading", {
        name: "Shop smarter. Live better.",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Shop collection",
      })
    ).toHaveAttribute("href", "/products");
  });

  it("shows loading state", () => {
    useProducts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderHome();

    expect(
      screen.getByText("Loading featured products...")
    ).toBeInTheDocument();
  });

  it("renders featured products", () => {
    useProducts.mockReturnValue({
      data: {
        products: [
          {
            id: 1,
            name: "iPhone 15",
          },
          {
            id: 2,
            name: "MacBook Air",
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderHome();

    expect(
      screen.getByText("iPhone 15")
    ).toBeInTheDocument();

    expect(
      screen.getByText("MacBook Air")
    ).toBeInTheDocument();

    expect(
      screen.getAllByTestId("product-card")
    ).toHaveLength(2);
  });

  it("shows an error message when products fail", () => {
    useProducts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        response: {
          data: {
            message: "Products unavailable",
          },
        },
      },
      refetch: vi.fn(),
    });

    renderHome();

    expect(
      screen.getByText("Products unavailable")
    ).toBeInTheDocument();
  });

  it("shows empty state when there are no products", () => {
    useProducts.mockReturnValue({
      data: {
        products: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderHome();

    expect(
      screen.getByText(
        "New products are coming soon"
      )
    ).toBeInTheDocument();
  });
});