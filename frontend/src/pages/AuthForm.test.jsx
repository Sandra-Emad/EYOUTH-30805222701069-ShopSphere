import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AuthForm from "./AuthForm";

vi.mock("../hooks/useAuth", () => ({
  default: vi.fn(),
}));

import useAuth from "../hooks/useAuth";

const renderAuthForm = (register = false) => {
  return render(
    <MemoryRouter initialEntries={[register ? "/register" : "/login"]}>
      <Routes>
        <Route
          path="/login"
          element={<AuthForm />}
        />

        <Route
          path="/register"
          element={<AuthForm register />}
        />

        <Route
          path="/"
          element={<h1>Home Page</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
};

describe("AuthForm", () => {
  it("renders login form", () => {
    useAuth.mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
    });

    renderAuthForm(false);

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Email")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Login",
      })
    ).toBeInTheDocument();
  });

  it("renders registration form", () => {
    useAuth.mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
    });

    renderAuthForm(true);

    expect(
      screen.getByRole("heading", {
        name: "Create your account",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Name")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Email")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Create account",
      })
    ).toBeInTheDocument();
  });

  it("submits login credentials", async () => {
    const login = vi.fn().mockResolvedValue({});

    useAuth.mockReturnValue({
      login,
      register: vi.fn(),
    });

    renderAuthForm(false);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: {
        value: "user@example.com",
      },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "password123",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText("Home Page")
      ).toBeInTheDocument();
    });
  });

  it("submits registration data", async () => {
    const register = vi.fn().mockResolvedValue({});

    useAuth.mockReturnValue({
      login: vi.fn(),
      register,
    });

    renderAuthForm(true);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: {
        value: "Sandra",
      },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: {
        value: "sandra@example.com",
      },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "password123",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create account",
      })
    );

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: "Sandra",
        email: "sandra@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText("Home Page")
      ).toBeInTheDocument();
    });
  });

  it("displays authentication errors", async () => {
    const login = vi
      .fn()
      .mockRejectedValue({
        response: {
          data: {
            message: "Invalid email or password",
          },
        },
      });

    useAuth.mockReturnValue({
      login,
      register: vi.fn(),
    });

    renderAuthForm(false);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: {
        value: "wrong@example.com",
      },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "wrongpassword",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Invalid email or password"
    );
  });
});