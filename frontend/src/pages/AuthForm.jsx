import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

export default function AuthForm({ register = false }) {
  const {
    login,
    register: createAccount,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      if (register) {
        await createAccount(form);
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }

      navigate(location.state?.from?.pathname || "/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We could not complete that request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">BlueCart account</span>

        <h1>
          {register
            ? "Create your account"
            : "Welcome back"}
        </h1>

        <p>
          {register
            ? "Create an account to save products in your cart."
            : "Sign in to continue shopping."}
        </p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {register && (
          <label htmlFor="name">
            Name

            <input
              id="name"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
            />
          </label>
        )}

        <label htmlFor="email">
          Email

          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
          />
        </label>

        <label htmlFor="password">
          Password

          <input
            id="password"
            name="password"
            type="password"
            minLength="6"
            required
            value={form.password}
            onChange={handleChange}
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={submitting}
        >
          {submitting
            ? "Please wait..."
            : register
              ? "Create account"
              : "Login"}
        </button>

        <p className="auth-switch">
          {register
            ? "Already have an account?"
            : "New to BlueCart?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Login" : "Create one"}
          </Link>
        </p>
      </form>
    </main>
  );
}