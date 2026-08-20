import fs from "fs/promises";
import path from "path";

import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(
      `Invalid ${fieldName}`,
      400
    );
  }

  return parsed;
};

const ensureProductExists = async (
  productId,
  database
) => {
  const product =
    await database.product.findUnique({
      where: {
        id: productId,
      },
    });

  if (!product) {
    throw new AppError(
      "Product not found",
      404
    );
  }

  return product;
};

/*
|--------------------------------------------------------------------------
| Upload Product Image
|--------------------------------------------------------------------------
*/

const uploadProductImage = async ({
  productId,
  url,
  altText,
  database = prisma,
}) => {
  const parsedProductId =
    parsePositiveInteger(
      productId,
      "product ID"
    );

  if (!url) {
    throw new AppError(
      "Product image URL is required",
      400
    );
  }

  const product =
    await ensureProductExists(
      parsedProductId,
      database
    );

  const image =
    await database.productImage.create({
      data: {
        url,
        altText:
          altText?.trim() ||
          product.name,
        productId:
          parsedProductId,
      },
    });

  return image;
};

/*
|--------------------------------------------------------------------------
| Get Product Images
|--------------------------------------------------------------------------
*/

const getProductImages = async (
  productId,
  database = prisma
) => {
  const parsedProductId =
    parsePositiveInteger(
      productId,
      "product ID"
    );

  await ensureProductExists(
    parsedProductId,
    database
  );

  return database.productImage.findMany({
    where: {
      productId: parsedProductId,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

/*
|--------------------------------------------------------------------------
| Delete Physical File
|--------------------------------------------------------------------------
*/

const deletePhysicalFile = async (
  url
) => {
  if (
    !url ||
    !url.startsWith("/uploads/")
  ) {
    return;
  }

  const relativePath = url
    .replace(/^\/+/, "")
    .replace(/\//g, path.sep);

  const filePath = path.join(
    process.cwd(),
    relativePath
  );

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(
        "Failed to delete product image file:",
        error.message
      );
    }
  }
};

/*
|--------------------------------------------------------------------------
| Delete Product Image
|--------------------------------------------------------------------------
*/

const deleteProductImage = async (
  imageId,
  database = prisma
) => {
  const parsedImageId =
    parsePositiveInteger(
      imageId,
      "image ID"
    );

  const image =
    await database.productImage.findUnique({
      where: {
        id: parsedImageId,
      },
    });

  if (!image) {
    throw new AppError(
      "Product image not found",
      404
    );
  }

  await database.productImage.delete({
    where: {
      id: parsedImageId,
    },
  });

  await deletePhysicalFile(
    image.url
  );

  return {
    message:
      "Product image deleted successfully",
  };
};

export {
  uploadProductImage,
  getProductImages,
  deleteProductImage,
};

export default {
  uploadProductImage,
  getProductImages,
  deleteProductImage,
};