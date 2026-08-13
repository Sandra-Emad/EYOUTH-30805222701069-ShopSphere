import { registerSchema } from "../../src/validators/auth.validator.js";

describe("Registration Validation", () => {
  test("should accept valid registration data", () => {
    const { error } = registerSchema.validate({
      name: "Sandra",
      email: "sandra@example.com",
      password: "Password123",
    });

    expect(error).toBeUndefined();
  });

  test("should reject invalid email", () => {
    const { error } = registerSchema.validate({
      name: "Sandra",
      email: "wrong-email",
      password: "Password123",
    });

    expect(error).toBeDefined();
  });

  test("should reject short password", () => {
    const { error } = registerSchema.validate({
      name: "Sandra",
      email: "sandra@example.com",
      password: "123",
    });

    expect(error).toBeDefined();
  });

  test("should reject missing name", () => {
    const { error } = registerSchema.validate({
      email: "sandra@example.com",
      password: "Password123",
    });

    expect(error).toBeDefined();
  });
});