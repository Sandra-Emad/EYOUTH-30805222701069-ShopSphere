import authService from "../services/auth.service.js";
import { sendWelcomeEmail } from "../services/email.service.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await authService.registerUser(
      {
        name,
        email,
        password,
      },
      req.database
    );

    try {
      await sendWelcomeEmail({
        name: user.name,
        email: user.email,
      });
    } catch (emailError) {
      console.error(
        "Welcome email error:",
        emailError.message
      );
    }

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message || "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(
      {
        email,
        password,
      },
      req.database
    );

    res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message || "Login failed",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(
      req.user.userId,
      req.database
    );

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "Failed to get current user",
    });
  }
};

export const updateMe = async (req, res) => {
  try {
    const user =
      await authService.updateCurrentUser(
        req.user.userId,
        req.body,
        req.database
      );

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error(
      "Update current user error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "Failed to update profile",
    });
  }
};