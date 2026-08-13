import prisma from "../config/prisma.js";

const getAllProducts = async (database = prisma) => {
  return database.product.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      category: true,
    },
  });
};

const getProductById = async (id, database = prisma) => {
  const productId = Number(id);

  const product = await database.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return product;
};

const createProduct = async (
  {
    name,
    description,
    price,
    stock,
    imageUrl,
    categoryId,
  },
  database = prisma
) => {
  const normalizedName = name.trim();
  const normalizedCategoryId = Number(categoryId);

  const category = await database.category.findUnique({
    where: {
      id: normalizedCategoryId,
    },
  });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  const existingProduct = await database.product.findFirst({
    where: {
      name: normalizedName,
      categoryId: normalizedCategoryId,
    },
  });

  if (existingProduct) {
    const error = new Error("Product already exists");
    error.statusCode = 409;
    throw error;
  }

  return database.product.create({
    data: {
      name: normalizedName,
      description: description?.trim() || null,
      price,
      stock,
      imageUrl: imageUrl?.trim() || null,
      categoryId: normalizedCategoryId,
    },
    include: {
      category: true,
    },
  });
};

const updateProduct = async (
  id,
  {
    name,
    description,
    price,
    stock,
    imageUrl,
    categoryId,
  },
  database = prisma
) => {
  const productId = Number(id);
  const normalizedCategoryId = Number(categoryId);
  const normalizedName = name.trim();

  const existingProduct = await database.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!existingProduct) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  const category = await database.category.findUnique({
    where: {
      id: normalizedCategoryId,
    },
  });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  const duplicateProduct = await database.product.findFirst({
    where: {
      name: normalizedName,
      categoryId: normalizedCategoryId,
      NOT: {
        id: productId,
      },
    },
  });

  if (duplicateProduct) {
    const error = new Error("Product already exists");
    error.statusCode = 409;
    throw error;
  }

  return database.product.update({
    where: {
      id: productId,
    },
    data: {
      name: normalizedName,
      description: description?.trim() || null,
      price,
      stock,
      imageUrl: imageUrl?.trim() || null,
      categoryId: normalizedCategoryId,
    },
    include: {
      category: true,
    },
  });
};

const deleteProduct = async (id, database = prisma) => {
  const productId = Number(id);

  const existingProduct = await database.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!existingProduct) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  await database.product.delete({
    where: {
      id: productId,
    },
  });

  return {
    message: "Product deleted successfully",
  };
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};