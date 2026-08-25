import { render, screen } from "@testing-library/react";
import {
  MemoryRouter,
} from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import App from "./App";

vi.mock("./components/Navbar", () => ({
  default: () => <nav>Navbar</nav>,
}));

vi.mock("./components/ProtectedRoute", () => ({
  default: ({ children }) => children,
}));

vi.mock("./pages/Home", () => ({
  default: () => <h1>Home Page</h1>,
}));

vi.mock("./pages/Products", () => ({
  default: () => <h1>Products Page</h1>,
}));

vi.mock("./pages/ProductDetails", () => ({
  default: () => <h1>Product Details Page</h1>,
}));

vi.mock("./pages/Cart", () => ({
  default: () => <h1>Cart Page</h1>,
}));

vi.mock("./pages/Login", () => ({
  default: () => <h1>Login Page</h1>,
}));

vi.mock("./pages/Register", () => ({
  default: () => <h1>Register Page</h1>,
}));

vi.mock("./pages/AdminDashboard", () => ({
  default: () => <h1>Admin Dashboard</h1>,
}));

const renderApp = (initialEntries) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );

describe("App routing", () => {
  it("renders home route", () => {
    renderApp(["/"]);

    expect(
      screen.getByRole("heading", {
        name: "Home Page",
      })
    ).toBeInTheDocument();
  });

  it("renders products route", () => {
    renderApp(["/products"]);

    expect(
      screen.getByRole("heading", {
        name: "Products Page",
      })
    ).toBeInTheDocument();
  });

  it("renders product details route", () => {
    renderApp(["/products/1"]);

    expect(
      screen.getByRole("heading", {
        name: "Product Details Page",
      })
    ).toBeInTheDocument();
  });

  it("renders login route", () => {
    renderApp(["/login"]);

    expect(
      screen.getByRole("heading", {
        name: "Login Page",
      })
    ).toBeInTheDocument();
  });

  it("renders register route", () => {
    renderApp(["/register"]);

    expect(
      screen.getByRole("heading", {
        name: "Register Page",
      })
    ).toBeInTheDocument();
  });

  it("renders cart route", () => {
    renderApp(["/cart"]);

    expect(
      screen.getByRole("heading", {
        name: "Cart Page",
      })
    ).toBeInTheDocument();
  });

  it("renders admin route", () => {
    renderApp(["/admin"]);

    expect(
      screen.getByRole("heading", {
        name: "Admin Dashboard",
      })
    ).toBeInTheDocument();
  });

  it("renders not found page", () => {
    renderApp(["/something-that-does-not-exist"]);

    expect(
      screen.getByRole("heading", {
        name: "Page not found",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Go home",
      })
    ).toHaveAttribute("href", "/");
  });
});