import prisma from "../config/prisma.js";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const normalizeProduct = (product) => {
  if (!product) {
    return product;
  }

  const normalizedProduct = {
    ...product,
    price:
      product.price !== undefined &&
      product.price !== null
        ? product.price.toString()
        : product.price,
  };

  /*
   * Only add images when the returned database object
   * actually contains an images property.
   *
   * This keeps the service compatible with both:
   * - Product queries that include images
   * - Tests/mocks that only provide category
   */
  if (Array.isArray(product.images)) {
    normalizedProduct.images = product.images;

    if (
      !product.imageUrl &&
      product.images.length > 0
    ) {
      normalizedProduct.imageUrl =
        product.images[0].url;
    }
  }

  return normalizedProduct;
};

const createError = (
  message,
  statusCode = 400
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/* -------------------------------------------------------------------------- */
/* Product Include                                                            */
/* -------------------------------------------------------------------------- */

const productInclude = {
  category: true,
};

/* -------------------------------------------------------------------------- */
/* Get All Products                                                           */
/* -------------------------------------------------------------------------- */

export const getAllProducts = async (
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
  const safePage = Math.max(
    Number(page) || 1,
    1
  );

  const safeLimit = Math.min(
    Math.max(Number(limit) || 10, 1),
    100
  );

  const skip =
    (safePage - 1) * safeLimit;

  const allowedSortFields = {
    name: "name",
    price: "price",
    createdAt: "createdAt",
  };

  const orderField =
    allowedSortFields[sortBy] ||
    "createdAt";

  const orderDirection =
    sortOrder === "asc"
      ? "asc"
      : "desc";

  const where = {};

  /* Search */

  if (
    typeof search === "string" &&
    search.trim()
  ) {
    const searchValue =
      search.trim();

    where.OR = [
      {
        name: {
          contains: searchValue,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchValue,
          mode: "insensitive",
        },
      },
    ];
  }

  /* Category filter */

  if (
    categoryId !== undefined &&
    categoryId !== ""
  ) {
    const parsedCategoryId =
      Number(categoryId);

    if (
      !Number.isInteger(
        parsedCategoryId
      ) ||
      parsedCategoryId <= 0
    ) {
      throw createError(
        "Category ID must be a valid number",
        400
      );
    }

    where.categoryId =
      parsedCategoryId;
  }

  /* Query */

  const [products, total] =
    await Promise.all([
      database.product.findMany({
        where,
        include: productInclude,
        orderBy: {
          [orderField]:
            orderDirection,
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
      : Math.ceil(
          total / safeLimit
        );

  return {
    products:
      products.map(
        normalizeProduct
      ),

    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage:
        safePage < totalPages,
      hasPreviousPage:
        safePage > 1,
    },
  };
};

/* -------------------------------------------------------------------------- */
/* Compatibility Alias                                                        */
/* -------------------------------------------------------------------------- */

export const getProducts =
  getAllProducts;

/* -------------------------------------------------------------------------- */
/* Get Product By ID                                                          */
/* -------------------------------------------------------------------------- */

export const getProductById = async (
  id,
  database = prisma
) => {
  const productId = Number(id);

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    throw createError(
      "Invalid product ID",
      400
    );
  }

  const product =
    await database.product.findUnique({
      where: {
        id: productId,
      },
      include: productInclude,
    });

  if (!product) {
    throw createError(
      "Product not found",
      404
    );
  }

  return normalizeProduct(product);
};

/* -------------------------------------------------------------------------- */
/* Create Product                                                             */
/* -------------------------------------------------------------------------- */

export const createProduct = async (
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
  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    throw createError(
      "Product name is required",
      400
    );
  }

  const normalizedName =
    name.trim();

  const parsedCategoryId =
    Number(categoryId);

  if (
    !Number.isInteger(
      parsedCategoryId
    ) ||
    parsedCategoryId <= 0
  ) {
    throw createError(
      "Category ID must be a valid number",
      400
    );
  }

  /* Check duplicate product */

  const existingProduct =
    await database.product.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: "insensitive",
        },
      },
    });

  if (existingProduct) {
    throw createError(
      "Product already exists",
      409
    );
  }

  /* Check category */

  const category =
    await database.category.findUnique({
      where: {
        id: parsedCategoryId,
      },
    });

  if (!category) {
    throw createError(
      "Category not found",
      404
    );
  }

  /* Create */

  const product =
    await database.product.create({
      data: {
        name: normalizedName,

        description:
          typeof description ===
          "string"
            ? description.trim() ||
              null
            : null,

        price,

        stock:
          Number(stock) || 0,

        imageUrl:
          imageUrl || null,

        categoryId:
          parsedCategoryId,
      },

      include: productInclude,
    });

  return normalizeProduct(product);
};

/* -------------------------------------------------------------------------- */
/* Update Product                                                             */
/* -------------------------------------------------------------------------- */

export const updateProduct = async (
  id,
  data,
  database = prisma
) => {
  const productId = Number(id);

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    throw createError(
      "Invalid product ID",
      400
    );
  }

  /* Find existing product */

  const existingProduct =
    await database.product.findUnique({
      where: {
        id: productId,
      },
    });

  if (!existingProduct) {
    throw createError(
      "Product not found",
      404
    );
  }

  /* Duplicate name check */

  if (
    data.name !== undefined &&
    typeof data.name === "string"
  ) {
    const normalizedNewName =
      data.name.trim();

    const currentName =
      typeof existingProduct.name ===
      "string"
        ? existingProduct.name.trim()
        : "";

    if (
      normalizedNewName.toLowerCase() !==
      currentName.toLowerCase()
    ) {
      const duplicate =
        await database.product.findFirst({
          where: {
            name: {
              equals:
                normalizedNewName,
              mode: "insensitive",
            },
            NOT: {
              id: productId,
            },
          },
        });

      if (duplicate) {
        throw createError(
          "Product already exists",
          409
        );
      }
    }
  }

  /* Category check */

  let parsedCategoryId;

  if (
    data.categoryId !== undefined
  ) {
    parsedCategoryId =
      Number(data.categoryId);

    if (
      !Number.isInteger(
        parsedCategoryId
      ) ||
      parsedCategoryId <= 0
    ) {
      throw createError(
        "Category ID must be a valid number",
        400
      );
    }

    const category =
      await database.category.findUnique({
        where: {
          id: parsedCategoryId,
        },
      });

    if (!category) {
      throw createError(
        "Category not found",
        404
      );
    }
  }

  /* Build update data */

  const updateData = {};

  if (data.name !== undefined) {
    updateData.name =
      typeof data.name === "string"
        ? data.name.trim()
        : data.name;
  }

  if (
    data.description !==
    undefined
  ) {
    updateData.description =
      typeof data.description ===
      "string"
        ? data.description.trim() ||
          null
        : null;
  }

  if (data.price !== undefined) {
    updateData.price = data.price;
  }

  if (data.stock !== undefined) {
    updateData.stock =
      Number(data.stock);
  }

  if (
    data.imageUrl !== undefined
  ) {
    updateData.imageUrl =
      data.imageUrl || null;
  }

  if (
    data.categoryId !== undefined
  ) {
    updateData.categoryId =
      parsedCategoryId;
  }

  /* Update */

  const product =
    await database.product.update({
      where: {
        id: productId,
      },

      data: updateData,

      include: productInclude,
    });

  return normalizeProduct(product);
};

/* -------------------------------------------------------------------------- */
/* Delete Product                                                             */
/* -------------------------------------------------------------------------- */

export const deleteProduct = async (
  id,
  database = prisma
) => {
  const productId = Number(id);

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    throw createError(
      "Invalid product ID",
      400
    );
  }

  const existingProduct =
    await database.product.findUnique({
      where: {
        id: productId,
      },
    });

  if (!existingProduct) {
    throw createError(
      "Product not found",
      404
    );
  }

  await database.product.delete({
    where: {
      id: productId,
    },
  });

  return {
    message:
      "Product deleted successfully",
  };
};

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  getAllProducts,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};