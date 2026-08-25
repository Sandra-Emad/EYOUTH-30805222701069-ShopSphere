import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";

vi.mock("../hooks/useAuth", () => ({
  default: vi.fn(),
}));

import useAuth from "../hooks/useAuth";

const renderRoute = (auth, adminOnly = false) => {
  useAuth.mockReturnValue(auth);

  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute adminOnly={adminOnly}>
              <h1>Protected Content</h1>
            </ProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={<h1>Login Page</h1>}
        />

        <Route
          path="/"
          element={<h1>Home Page</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
};

describe("ProtectedRoute", () => {
  it("shows loading state while authentication is initializing", () => {
    renderRoute({
      isAuthenticated: false,
      isAdmin: false,
      initializing: true,
    });

    expect(
      screen.getByText("Checking your account...")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    renderRoute({
      isAuthenticated: false,
      isAdmin: false,
      initializing: false,
    });

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    renderRoute({
      isAuthenticated: true,
      isAdmin: false,
      initializing: false,
    });

    expect(
      screen.getByText("Protected Content")
    ).toBeInTheDocument();
  });

  it("redirects normal users away from admin-only routes", () => {
    renderRoute(
      {
        isAuthenticated: true,
        isAdmin: false,
        initializing: false,
      },
      true
    );

    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("allows administrators to access admin routes", () => {
    renderRoute(
      {
        isAuthenticated: true,
        isAdmin: true,
        initializing: false,
      },
      true
    );

    expect(
      screen.getByText("Protected Content")
    ).toBeInTheDocument();
  });
});