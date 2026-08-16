import productService from "../services/product.service.js";

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      categoryId,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const result =
      await productService.getAllProducts(
        req.database,
        {
          search,
          categoryId,
          sortBy,
          sortOrder,
          page,
          limit,
        }
      );

    res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get products error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "Failed to get products",
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product =
      await productService.getProductById(
        req.params.id,
        req.database
      );

    res.status(200).json({
      product,
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "Failed to get product",
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product =
      await productService.createProduct(
        req.body,
        req.database
      );

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "Failed to create product",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product =
      await productService.updateProduct(
        req.params.id,
        req.body,
        req.database
      );

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(
      "Update product error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "Failed to update product",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const result =
      await productService.deleteProduct(
        req.params.id,
        req.database
      );

    res.status(200).json(result);
  } catch (error) {
    console.error(
      "Delete product error:",
      error.message
    );

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "Failed to delete product",
    });
  }
};