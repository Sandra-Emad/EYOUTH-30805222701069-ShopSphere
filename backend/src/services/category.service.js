import prisma from "../config/prisma.js";

const getAllCategories = async (database = prisma) => {
  return database.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

const getCategoryById = async (id, database = prisma) => {
  const category = await database.category.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      products: true,
    },
  });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return category;
};

const createCategory = async (
  { name, description },
  database = prisma
) => {
  const normalizedName = name.trim();

  const existingCategory = await database.category.findUnique({
    where: {
      name: normalizedName,
    },
  });

  if (existingCategory) {
    const error = new Error("Category already exists");
    error.statusCode = 409;
    throw error;
  }

  return database.category.create({
    data: {
      name: normalizedName,
      description: description?.trim() || null,
    },
  });
};

const updateCategory = async (
  id,
  { name, description },
  database = prisma
) => {
  const categoryId = Number(id);

  const existingCategory = await database.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!existingCategory) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  const normalizedName = name.trim();

  const duplicateCategory = await database.category.findFirst({
    where: {
      name: normalizedName,
      NOT: {
        id: categoryId,
      },
    },
  });

  if (duplicateCategory) {
    const error = new Error("Category already exists");
    error.statusCode = 409;
    throw error;
  }

  return database.category.update({
    where: {
      id: categoryId,
    },
    data: {
      name: normalizedName,
      description: description?.trim() || null,
    },
  });
};

const deleteCategory = async (id, database = prisma) => {
  const categoryId = Number(id);

  const existingCategory = await database.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      products: true,
    },
  });

  if (!existingCategory) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  if (existingCategory.products.length > 0) {
    const error = new Error(
      "Cannot delete category that contains products"
    );
    error.statusCode = 409;
    throw error;
  }

  await database.category.delete({
    where: {
      id: categoryId,
    },
  });

  return {
    message: "Category deleted successfully",
  };
};

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};