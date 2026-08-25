import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Products from "./Products";

vi.mock("../hooks/useProducts", () => ({
  useProducts: vi.fn(),
}));

vi.mock("../hooks/useCategories", () => ({
  useCategories: vi.fn(),
}));

vi.mock("../components/ProductCard", () => ({
  default: ({ product }) => (
    <article data-testid="product-card">
      {product.name}
    </article>
  ),
}));

import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

const products = [
  {
    id: 1,
    name: "iPhone 15",
    price: 999,
    stock: 10,
  },
  {
    id: 2,
    name: "MacBook Air",
    price: 1299,
    stock: 5,
  },
];

const categories = [
  {
    id: 8,
    name: "Phones",
  },
  {
    id: 9,
    name: "Laptops",
  },
  {
    id: 10,
    name: "Accessories",
  },
];

const renderProducts = () =>
  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );

const mockCategoriesSuccess = () => {
  useCategories.mockReturnValue({
    data: {
      categories,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
};

describe("Products page", () => {
  it("shows loading state", () => {
    useProducts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockCategoriesSuccess();

    renderProducts();

    expect(
      screen.getByText("Loading products...")
    ).toBeInTheDocument();
  });

  it("renders products", () => {
    useProducts.mockReturnValue({
      data: {
        products,
        pagination: {
          page: 1,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockCategoriesSuccess();

    renderProducts();

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

  it("shows an error message", () => {
    useProducts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        response: {
          data: {
            message: "Unable to load products",
          },
        },
      },
      refetch: vi.fn(),
    });

    mockCategoriesSuccess();

    renderProducts();

    expect(
      screen.getByText("Unable to load products")
    ).toBeInTheDocument();
  });

  it("can retry after an error", async () => {
    const refetch = vi.fn();

    useProducts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        response: {
          data: {
            message: "Server error",
          },
        },
      },
      refetch,
    });

    const refetchCategories = vi.fn();

    useCategories.mockReturnValue({
      data: {
        categories,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchCategories,
    });

    renderProducts();

    const retryButton = screen.getByRole("button", {
      name: /try again/i,
    });

    await retryButton.click();

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetchCategories).toHaveBeenCalledTimes(1);
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

    mockCategoriesSuccess();

    renderProducts();

    expect(
      screen.getByText("No products found")
    ).toBeInTheDocument();
  });

  it("updates the search field", () => {
    useProducts.mockReturnValue({
      data: {
        products: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockCategoriesSuccess();

    renderProducts();

    const searchInput = screen.getByRole("searchbox", {
      name: "Search products",
    });

    fireEvent.change(searchInput, {
      target: {
        value: "phone",
      },
    });

    expect(searchInput).toHaveValue("phone");
  });

  it("allows changing the category", () => {
    useProducts.mockReturnValue({
      data: {
        products: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockCategoriesSuccess();

    renderProducts();

    const phonesButton = screen.getByRole("button", {
      name: "Phones",
    });

    fireEvent.click(phonesButton);

    expect(phonesButton).toHaveClass("active");
  });
});