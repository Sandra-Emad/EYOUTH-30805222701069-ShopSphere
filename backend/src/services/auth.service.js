import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

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

export default {
  registerUser,
};