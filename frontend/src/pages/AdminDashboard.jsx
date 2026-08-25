import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import api from "../api/axios";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { useProducts } from "../hooks/useProducts";
import { useStatistics } from "../hooks/useStatistics";
import { useCategories } from "../hooks/useCategories";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  imageUrl: "",
  categoryId: "",
};

const formatMoney = (price) => {
  return `$${Number(price || 0).toFixed(2)}`;
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorObject,
    refetch: refetchProducts,
  } = useProducts({
    page: 1,
    limit: 100,
  });

  const {
    data: statisticsData,
    isLoading: statisticsLoading,
    isError: statisticsError,
    error: statisticsErrorObject,
    refetch: refetchStatistics,
  } = useStatistics();

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorObject,
    refetch: refetchCategories,
  } = useCategories();

  const products = useMemo(() => {
    return (
      productsData?.products ??
      productsData?.data?.products ??
      (Array.isArray(productsData)
        ? productsData
        : [])
    );
  }, [productsData]);

  const statistics = useMemo(() => {
    return (
      statisticsData?.statistics ??
      statisticsData?.data?.statistics ??
      {}
    );
  }, [statisticsData]);

  const categories = useMemo(() => {
    return (
      categoriesData?.categories ??
      categoriesData?.data?.categories ??
      (Array.isArray(categoriesData)
        ? categoriesData
        : [])
    );
  }, [categoriesData]);

  const refreshDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["products"],
      }),

      queryClient.invalidateQueries({
        queryKey: ["statistics"],
      }),

      queryClient.invalidateQueries({
        queryKey: ["categories"],
      }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (productData) =>
      api.post("/products", productData),

    onSuccess: async () => {
      setMessage("Product created successfully.");
      setForm(emptyForm);

      await refreshDashboard();
    },

    onError: (err) => {
      setMessage(
        err.response?.data?.message ||
          "Unable to create product."
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, productData }) =>
      api.put(`/products/${id}`, productData),

    onSuccess: async () => {
      setMessage("Product updated successfully.");
      setForm(emptyForm);
      setEditingId(null);

      await refreshDashboard();
    },

    onError: (err) => {
      setMessage(
        err.response?.data?.message ||
          "Unable to update product."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      api.delete(`/products/${id}`),

    onSuccess: async () => {
      setMessage("Product deleted successfully.");

      await refreshDashboard();
    },

    onError: (err) => {
      setMessage(
        err.response?.data?.message ||
          "Unable to delete product."
      );
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const selectCategory = (categoryId) => {
    setFormError("");

    setForm((current) => ({
      ...current,
      categoryId: String(categoryId),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setMessage("");
    setFormError("");

    if (!form.categoryId) {
      setFormError("Please choose a category.");
      return;
    }

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim(),
      categoryId: Number(form.categoryId),
    };

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        productData,
      });

      return;
    }

    createMutation.mutate(productData);
  };

  const handleEdit = (product) => {
    setMessage("");
    setFormError("");
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      imageUrl: product.imageUrl || "",
      categoryId: String(
        product.categoryId ??
          product.category?.id ??
          ""
      ),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setFormError("");
  };

  const handleDelete = (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchProducts(),
      refetchStatistics(),
      refetchCategories(),
    ]);
  };

  const submitting =
    createMutation.isPending ||
    updateMutation.isPending;

  const inventory = products.reduce(
    (sum, product) =>
      sum + Number(product.stock || 0),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock || 0) < 5
  ).length;

  const hasMutationError =
    createMutation.isError ||
    updateMutation.isError ||
    deleteMutation.isError;

  const isLoading =
    productsLoading ||
    statisticsLoading ||
    categoriesLoading;

  if (isLoading) {
    return (
      <main className="page">
        <Loader text="Loading dashboard..." />
      </main>
    );
  }

  if (
    productsError ||
    statisticsError ||
    categoriesError
  ) {
    return (
      <main className="page">
        <div className="container">
          <ErrorMessage
            message={
              productsErrorObject?.response?.data
                ?.message ||
              statisticsErrorObject?.response?.data
                ?.message ||
              categoriesErrorObject?.response?.data
                ?.message ||
              "Unable to load dashboard data."
            }
            onRetry={handleRefresh}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <section className="page-heading">
          <span className="eyebrow">
            Admin area
          </span>

          <h1>Store dashboard</h1>

          <p>
            Add, edit, delete, and monitor your
            products and store performance.
          </p>
        </section>

        <section className="stat-grid">
          <div>
            <span>Products</span>

            <strong>
              {Number(
                statistics.products ??
                  products.length
              )}
            </strong>
          </div>

          <div>
            <span>Units in stock</span>

            <strong>{inventory}</strong>
          </div>

          <div>
            <span>Low-stock products</span>

            <strong>{lowStock}</strong>
          </div>

          <div>
            <span>Customers</span>

            <strong>
              {Number(statistics.users ?? 0)}
            </strong>
          </div>

          <div>
            <span>Orders</span>

            <strong>
              {Number(statistics.orders ?? 0)}
            </strong>
          </div>

          <div>
            <span>Total revenue</span>

            <strong>
              {formatMoney(
                statistics.revenue ?? 0
              )}
            </strong>
          </div>
        </section>

        <section className="admin-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                Store performance
              </span>

              <h2>Order statistics</h2>
            </div>
          </div>

          <div className="stat-grid">
            <div>
              <span>Pending</span>

              <strong>
                {Number(
                  statistics.ordersByStatus
                    ?.pending ?? 0
                )}
              </strong>
            </div>

            <div>
              <span>Processing</span>

              <strong>
                {Number(
                  statistics.ordersByStatus
                    ?.processing ?? 0
                )}
              </strong>
            </div>

            <div>
              <span>Shipped</span>

              <strong>
                {Number(
                  statistics.ordersByStatus
                    ?.shipped ?? 0
                )}
              </strong>
            </div>

            <div>
              <span>Delivered</span>

              <strong>
                {Number(
                  statistics.ordersByStatus
                    ?.delivered ?? 0
                )}
              </strong>
            </div>

            <div>
              <span>Cancelled</span>

              <strong>
                {Number(
                  statistics.ordersByStatus
                    ?.cancelled ?? 0
                )}
              </strong>
            </div>

            <div>
              <span>Categories</span>

              <strong>
                {Number(
                  statistics.categories ?? 0
                )}
              </strong>
            </div>
          </div>
        </section>

        <section className="admin-panel admin-form-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                Product management
              </span>

              <h2>
                {editingId
                  ? "Edit product"
                  : "Add a new product"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={cancelEdit}
              >
                Cancel edit
              </button>
            )}
          </div>

          {message && (
            <p
              className={
                hasMutationError
                  ? "admin-message admin-message-error"
                  : "admin-message"
              }
            >
              {message}
            </p>
          )}

          {formError && (
            <p className="admin-message admin-message-error">
              {formError}
            </p>
          )}

          <form
            className="admin-form"
            onSubmit={handleSubmit}
          >
            <label htmlFor="name">
              Product name

              <input
                id="name"
                name="name"
                required
                minLength="2"
                maxLength="255"
                value={form.name}
                onChange={handleChange}
              />
            </label>

            <label htmlFor="price">
              Price

              <input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.price}
                onChange={handleChange}
              />
            </label>

            <label htmlFor="stock">
              Stock quantity

              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                required
                value={form.stock}
                onChange={handleChange}
              />
            </label>

            <div className="category-selector">
              <span>Category</span>

              <div className="category-buttons">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={
                      Number(form.categoryId) ===
                      Number(category.id)
                        ? "category-button active"
                        : "category-button"
                    }
                    onClick={() =>
                      selectCategory(category.id)
                    }
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <label
              htmlFor="imageUrl"
              className="admin-form-wide"
            >
              Image URL (optional)

              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://example.com/product-image.jpg"
                value={form.imageUrl}
                onChange={handleChange}
              />
            </label>

            <label
              htmlFor="description"
              className="admin-form-wide"
            >
              Description

              <textarea
                id="description"
                name="description"
                maxLength="2000"
                value={form.description}
                onChange={handleChange}
              />
            </label>

            <div className="admin-form-wide">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create product"}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                Store products
              </span>

              <h2>Product overview</h2>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleRefresh}
            >
              Refresh
            </button>
          </div>

          {products.length > 0 ? (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Category ID</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>

                      <td>
                        {product.category?.name ||
                          "—"}
                      </td>

                      <td>
                        {product.categoryId ??
                          product.category?.id ??
                          "—"}
                      </td>

                      <td>
                        {formatMoney(product.price)}
                      </td>

                      <td>
                        {product.stock ?? 0}
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() =>
                              handleEdit(product)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger"
                            disabled={
                              deleteMutation.isPending
                            }
                            onClick={() =>
                              handleDelete(product)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h2>No products yet</h2>

              <p>
                Use the form above to create the
                first product.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}