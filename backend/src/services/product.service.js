import prisma from "../config/prisma.js";

const normalizeProduct = (product) => {
  if (!product) {
    return product;
  }

  return {
    ...product,
    price: product.price?.toString(),
  };
};

const getAllProducts = async (
  database = prisma,
  {
    search = "",
    categoryId,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = {}
) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(
    Math.max(Number(limit) || 10, 1),
    100
  );

  const skip = (safePage - 1) * safeLimit;

  const allowedSortFields = {
    name: "name",
    price: "price",
    createdAt: "createdAt",
  };

  const orderField =
    allowedSortFields[sortBy] || "createdAt";

  const orderDirection =
    sortOrder === "asc" ? "asc" : "desc";

  const where = {};

  if (search && search.trim()) {
    where.OR = [
      {
        name: {
          contains: search.trim(),
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search.trim(),
          mode: "insensitive",
        },
      },
    ];
  }

  if (categoryId !== undefined && categoryId !== "") {
    const parsedCategoryId = Number(categoryId);

    if (!Number.isInteger(parsedCategoryId)) {
      const error = new Error(
        "Category ID must be a valid number"
      );

      error.statusCode = 400;
      throw error;
    }

    where.categoryId = parsedCategoryId;
  }

  const [products, total] = await Promise.all([
    database.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        [orderField]: orderDirection,
      },
      skip,
      take: safeLimit,
    }),

    database.product.count({
      where,
    }),
  ]);

  const totalPages =
    total === 0
      ? 0
      : Math.ceil(total / safeLimit);

  return {
    products: products.map(normalizeProduct),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
};

const getProductById = async (
  id,
  database = prisma
) => {
  const productId = Number(id);

  if (!Number.isInteger(productId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

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

  return normalizeProduct(product);
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
  const existingProduct =
    await database.product.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

  if (existingProduct) {
    const error = new Error("Product already exists");
    error.statusCode = 409;
    throw error;
  }

  const category =
    await database.category.findUnique({
      where: {
        id: Number(categoryId),
      },
    });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  const product = await database.product.create({
    data: {
      name: name.trim(),
      description:
        description?.trim() || null,
      price,
      stock: Number(stock) || 0,
      imageUrl: imageUrl || null,
      categoryId: Number(categoryId),
    },
    include: {
      category: true,
    },
  });

  return normalizeProduct(product);
};

const updateProduct = async (
  id,
  data,
  database = prisma
) => {
  const productId = Number(id);

  if (!Number.isInteger(productId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  const existingProduct =
    await database.product.findUnique({
      where: {
        id: productId,
      },
    });

  if (!existingProduct) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (
    data.name &&
    data.name.trim().toLowerCase() !==
      existingProduct.name.toLowerCase()
  ) {
    const duplicate =
      await database.product.findFirst({
        where: {
          name: {
            equals: data.name.trim(),
            mode: "insensitive",
          },
          NOT: {
            id: productId,
          },
        },
      });

    if (duplicate) {
      const error = new Error(
        "Product already exists"
      );

      error.statusCode = 409;
      throw error;
    }
  }

  if (data.categoryId !== undefined) {
    const category =
      await database.category.findUnique({
        where: {
          id: Number(data.categoryId),
        },
      });

    if (!category) {
      const error = new Error(
        "Category not found"
      );

      error.statusCode = 404;
      throw error;
    }
  }

  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }

  if (data.description !== undefined) {
    updateData.description =
      data.description?.trim() || null;
  }

  if (data.price !== undefined) {
    updateData.price = data.price;
  }

  if (data.stock !== undefined) {
    updateData.stock = Number(data.stock);
  }

  if (data.imageUrl !== undefined) {
    updateData.imageUrl =
      data.imageUrl || null;
  }

  if (data.categoryId !== undefined) {
    updateData.categoryId =
      Number(data.categoryId);
  }

  const product =
    await database.product.update({
      where: {
        id: productId,
      },
      data: updateData,
      include: {
        category: true,
      },
    });

  return normalizeProduct(product);
};

const deleteProduct = async (
  id,
  database = prisma
) => {
  const productId = Number(id);

  if (!Number.isInteger(productId)) {
    const error = new Error("Invalid product ID");
    error.statusCode = 400;
    throw error;
  }

  const existingProduct =
    await database.product.findUnique({
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