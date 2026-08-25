import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Navbar from "./Navbar";

vi.mock("../hooks/useAuth", () => ({
  default: vi.fn(),
}));

vi.mock("../hooks/useCart", () => ({
  default: vi.fn(),
}));

import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

describe("Navbar", () => {
  it("renders the brand and navigation links", () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      logout: vi.fn(),
    });

    useCart.mockReturnValue({
      itemCount: 0,
    });

    renderNavbar();

    expect(screen.getByText("BlueCart")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Cart")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("shows the cart item count", () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      logout: vi.fn(),
    });

    useCart.mockReturnValue({
      itemCount: 3,
    });

    renderNavbar();

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows the authenticated user's name and logout button", () => {
    useAuth.mockReturnValue({
      user: {
        name: "Sandra",
        role: "CUSTOMER",
      },
      isAuthenticated: true,
      isAdmin: false,
      logout: vi.fn(),
    });

    useCart.mockReturnValue({
      itemCount: 2,
    });

    renderNavbar();

    expect(screen.getByText("Hi, Sandra")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Login" })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Register" })
    ).not.toBeInTheDocument();
  });

  it("shows the Admin link for administrators", () => {
    useAuth.mockReturnValue({
      user: {
        name: "Admin",
        role: "ADMIN",
      },
      isAuthenticated: true,
      isAdmin: true,
      logout: vi.fn(),
    });

    useCart.mockReturnValue({
      itemCount: 0,
    });

    renderNavbar();

    expect(
      screen.getByRole("link", { name: "Admin" })
    ).toBeInTheDocument();
  });

  it("does not show the Admin link for normal users", () => {
    useAuth.mockReturnValue({
      user: {
        name: "Customer",
        role: "CUSTOMER",
      },
      isAuthenticated: true,
      isAdmin: false,
      logout: vi.fn(),
    });

    useCart.mockReturnValue({
      itemCount: 0,
    });

    renderNavbar();

    expect(
      screen.queryByRole("link", { name: "Admin" })
    ).not.toBeInTheDocument();
  });

  it("calls logout when Logout is clicked", async () => {
    const logout = vi.fn();

    useAuth.mockReturnValue({
      user: {
        name: "Sandra",
        role: "CUSTOMER",
      },
      isAuthenticated: true,
      isAdmin: false,
      logout,
    });

    useCart.mockReturnValue({
      itemCount: 0,
    });

    renderNavbar();

    await screen.getByRole("button", {
      name: "Logout",
    }).click();

    expect(logout).toHaveBeenCalledTimes(1);
  });
});