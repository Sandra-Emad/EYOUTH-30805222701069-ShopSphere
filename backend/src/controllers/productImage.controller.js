import asyncHandler from "../utils/asyncHandler.js";

import {
  uploadProductImage as uploadProductImageService,
  getProductImages as getProductImagesService,
  deleteProductImage as deleteProductImageService,
} from "../services/productImage.service.js";

/*
|--------------------------------------------------------------------------
| Upload Product Image
|--------------------------------------------------------------------------
*/

const uploadProductImage = asyncHandler(
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Product image file is required",
      });
    }

    const image =
      await uploadProductImageService({
        productId:
          req.params.productId,

        url: `/uploads/products/${req.file.filename}`,

        altText:
          req.body.altText,

        database:
          req.database,
      });

    return res.status(201).json({
      success: true,
      message:
        "Product image uploaded successfully",
      image,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Get Product Images
|--------------------------------------------------------------------------
*/

const getProductImages = asyncHandler(
  async (req, res) => {
    const images =
      await getProductImagesService(
        req.params.productId,
        req.database
      );

    return res.status(200).json({
      success: true,
      count: images.length,
      images,
    });
  }
);

/*
|--------------------------------------------------------------------------
| Delete Product Image
|--------------------------------------------------------------------------
*/

const deleteProductImage = asyncHandler(
  async (req, res) => {
    const result =
      await deleteProductImageService(
        req.params.imageId,
        req.database
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  }
);

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