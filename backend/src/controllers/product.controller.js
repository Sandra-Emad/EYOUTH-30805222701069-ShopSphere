import asyncHandler from "../utils/asyncHandler.js";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../services/product.service.js";

import {
  deleteProductImage,
} from "../services/productImage.service.js";

const create = asyncHandler(async (req, res) => {
  const product = await createProduct(
    req.body,
    req.database
  );

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

const getAll = asyncHandler(async (req, res) => {
  const result = await getProducts(
    req.database,
    req.validatedQuery || req.query || {}
  );

  return res.status(200).json({
    success: true,
    ...result,
  });
});

const getOne = asyncHandler(async (req, res) => {
  const product = await getProductById(
    req.params.id,
    req.database
  );

  return res.status(200).json({
    success: true,
    product,
  });
});

const update = asyncHandler(async (req, res) => {
  const product = await updateProduct(
    req.params.id,
    req.body,
    req.database
  );

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

const remove = asyncHandler(async (req, res) => {
  const result = await deleteProduct(
    req.params.id,
    req.database
  );

  return res.status(200).json({
    success: true,
    ...result,
  });
});

const removeImage = asyncHandler(async (req, res) => {
  const result = await deleteProductImage(
    req.params.imageId,
    req.database
  );

  return res.status(200).json({
    success: true,
    ...result,
  });
});

export {
  create,
  getAll,
  getOne,
  update,
  remove,
  removeImage,
};

export default {
  create,
  getAll,
  getOne,
  update,
  remove,
  removeImage,
};