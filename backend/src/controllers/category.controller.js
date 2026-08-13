import categoryService from "../services/category.service.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories(
      req.database
    );

    res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to get categories",
    });
  }
};

export const getCategory = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(
      req.params.id,
      req.database
    );

    res.status(200).json({
      category,
    });
  } catch (error) {
    console.error("Get category error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to get category",
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(
      req.body,
      req.database
    );

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to create category",
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
      req.database
    );

    res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to update category",
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(
      req.params.id,
      req.database
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete category error:", error.message);

    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to delete category",
    });
  }
};