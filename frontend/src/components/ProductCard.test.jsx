import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProductCard from "./ProductCard";

vi.mock("../hooks/useAuth", () => ({
  default: vi.fn(),
}));

vi.mock("../hooks/useCart", () => ({
  default: vi.fn(),
}));

import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";

const product = {
  id: 1,
  name: "iPhone 15",
  description: "Latest Apple smartphone",
  price: 999.99,
  stock: 10,
  category: {
    name: "Phones",
  },
  images: [
    {
      url: "https://example.com/iphone.jpg",
    },
  ],
};

const renderCard = (item = product) =>
  render(
    <MemoryRouter>
      <ProductCard product={item} />
    </MemoryRouter>
  );

describe("ProductCard", () => {
  it("renders product information", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderCard();

    expect(screen.getByText("iPhone 15")).toBeInTheDocument();
    expect(
      screen.getByText("Latest Apple smartphone")
    ).toBeInTheDocument();

    expect(screen.getByText("Phones")).toBeInTheDocument();
    expect(screen.getByText("$999.99")).toBeInTheDocument();
  });

  it("renders product links with the correct URL", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderCard();

    const links = screen.getAllByRole("link", {
      name: /iPhone 15|Details/,
    });

    expect(
      links.some(
        (link) => link.getAttribute("href") === "/products/1"
      )
    ).toBe(true);
  });

  it("shows Out of stock when stock is zero", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderCard({
      ...product,
      stock: 0,
    });

    const button = screen.getByRole("button", {
      name: "Out of stock",
    });

    expect(button).toBeDisabled();
  });

  it("redirects unauthenticated users to login when Add is clicked", async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderCard();

    const addButton = screen.getByRole("button", {
      name: "Add",
    });

    await addButton.click();

    expect(window.location.pathname).toBe("/");
  });

  it("calls addToCart for authenticated users", async () => {
    const addToCart = vi.fn().mockResolvedValue({});

    useAuth.mockReturnValue({
      isAuthenticated: true,
    });

    useCart.mockReturnValue({
      addToCart,
    });

    renderCard();

    await screen.getByRole("button", {
      name: "Add",
    }).click();

    expect(addToCart).toHaveBeenCalledWith(1, 1);
  });
});