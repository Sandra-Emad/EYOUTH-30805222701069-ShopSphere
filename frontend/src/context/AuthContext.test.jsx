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

import AuthContext, {
  AuthProvider,
} from "./AuthContext";

const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

const useAuthContext = () => {
  return React.useContext(AuthContext);
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts unauthenticated without a token", () => {
    const { result } = renderHook(
      useAuthContext,
      {
        wrapper,
      }
    );

    expect(result.current.user).toBeNull();
    expect(
      result.current.isAuthenticated
    ).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it("logs in successfully and stores token", async () => {
    const { result } = renderHook(
      useAuthContext,
      {
        wrapper,
      }
    );

    await act(async () => {
      await result.current.login({
        email: "sandra@example.com",
        password: "password123",
      });
    });

    expect(localStorage.getItem("token")).toBe(
      "mock-customer-token"
    );

    expect(result.current.user).toMatchObject({
      name: "Sandra",
      email: "sandra@example.com",
      role: "CUSTOMER",
    });

    expect(
      result.current.isAuthenticated
    ).toBe(true);

    expect(result.current.isAdmin).toBe(false);
  });

  it("registers successfully", async () => {
    const { result } = renderHook(
      useAuthContext,
      {
        wrapper,
      }
    );

    await act(async () => {
      await result.current.register({
        name: "New User",
        email: "new@example.com",
        password: "password123",
      });
    });

    expect(
      localStorage.getItem("token")
    ).toBe("mock-customer-token");

    expect(result.current.user).toMatchObject({
      name: "New User",
      email: "new@example.com",
      role: "CUSTOMER",
    });
  });

  it("loads the current user when a valid token exists", async () => {
    localStorage.setItem(
      "token",
      "mock-customer-token"
    );

    const { result } = renderHook(
      useAuthContext,
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.user).toMatchObject({
        id: 1,
        name: "Sandra",
        email: "sandra@example.com",
      });
    });

    expect(
      result.current.isAuthenticated
    ).toBe(true);

    expect(result.current.initializing).toBe(
      false
    );
  });

  it("clears authentication on logout", async () => {
    localStorage.setItem(
      "token",
      "mock-customer-token"
    );

    const { result } = renderHook(
      useAuthContext,
      {
        wrapper,
      }
    );

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    act(() => {
      result.current.logout();
    });

    expect(
      localStorage.getItem("token")
    ).toBeNull();

    expect(result.current.user).toBeNull();

    expect(
      result.current.isAuthenticated
    ).toBe(false);
  });

  it("handles invalid credentials", async () => {
    const { result } = renderHook(
      useAuthContext,
      {
        wrapper,
      }
    );

    await expect(
      act(async () => {
        await result.current.login({
          email: "wrong@example.com",
          password: "wrongpassword",
        });
      })
    ).rejects.toThrow();

    expect(
      localStorage.getItem("token")
    ).toBeNull();

    expect(result.current.user).toBeNull();
  });

  it("identifies admin users correctly", async () => {
    const { result } = renderHook(
      useAuthContext,
      {
        wrapper,
      }
    );

    await act(async () => {
      await result.current.login({
        email: "admin@example.com",
        password: "password123",
      });
    });

    expect(result.current.user.role).toBe(
      "ADMIN"
    );

    expect(result.current.isAdmin).toBe(true);
  });
});