import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT secret is not configured");
    error.statusCode = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const registerUser = async (
  { name, email, password },
  database = prisma
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await database.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await database.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

const loginUser = async (
  { email, password },
  database = prisma
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await database.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: "7d",
    }
  );

  return {
    token,
    user: sanitizeUser(user),
  };
};

const getCurrentUser = async (
  userId,
  database = prisma
) => {
  const user = await database.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const updateCurrentUser = async (
  userId,
  { name, email, password },
  database = prisma
) => {
  const existingUser = await database.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const data = {};

  if (name !== undefined) {
    data.name = name.trim();
  }

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingEmailUser =
      await database.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (
      existingEmailUser &&
      existingEmailUser.id !== userId
    ) {
      const error = new Error(
        "Email is already registered"
      );
      error.statusCode = 409;
      throw error;
    }

    data.email = normalizedEmail;
  }

  if (password !== undefined) {
    data.password = await bcrypt.hash(password, 12);
  }

  const updatedUser = await database.user.update({
    where: {
      id: userId,
    },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return updatedUser;
};

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
};