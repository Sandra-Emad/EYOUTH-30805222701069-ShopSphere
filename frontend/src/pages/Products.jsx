import { useState } from "react";

import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

export default function Products() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt-desc");
  const [selectedCategory, setSelectedCategory] =
    useState(null);
  const [page, setPage] = useState(1);

  const [sortBy, sortOrder] = sort.split("-");

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorObject,
    refetch: refetchProducts,
  } = useProducts({
    search,
    sortBy,
    sortOrder,
    page,
    limit: 12,
    categoryId: selectedCategory || undefined,
  });

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorObject,
    refetch: refetchCategories,
  } = useCategories();

  const products =
    productsData?.products ??
    productsData?.data?.products ??
    (Array.isArray(productsData)
      ? productsData
      : []);

  const pagination =
    productsData?.pagination ??
    productsData?.data?.pagination;

  const categories =
    categoriesData?.categories ??
    categoriesData?.data?.categories ??
    (Array.isArray(categoriesData)
      ? categoriesData
      : []);

  const selectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleRetry = async () => {
    await Promise.all([
      refetchProducts(),
      refetchCategories(),
    ]);
  };

  const isLoading =
    productsLoading || categoriesLoading;

  const isError =
    productsError || categoriesError;

  return (
    <main className="page">
      <div className="container">
        <section className="page-heading">
          <span className="eyebrow">
            Our collection
          </span>

          <h1>Explore products</h1>

          <p>
            Browse products from the live store catalog.
          </p>
        </section>

        <section className="filters">
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search products..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          <select
            aria-label="Sort products"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="createdAt-desc">
              Newest
            </option>

            <option value="price-asc">
              Price: low to high
            </option>

            <option value="price-desc">
              Price: high to low
            </option>

            <option value="name-asc">
              Name: A-Z
            </option>

            <option value="name-desc">
              Name: Z-A
            </option>
          </select>
        </section>

        <section className="catalog-categories">
          <span>Browse by category</span>

          <div className="category-buttons">
            <button
              type="button"
              className={
                selectedCategory === null
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() => selectCategory(null)}
            >
              All products
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={
                  selectedCategory === category.id
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
        </section>

        {isLoading && (
          <Loader text="Loading products..." />
        )}

        {isError && (
          <ErrorMessage
            message={
              productsErrorObject?.response?.data
                ?.message ||
              categoriesErrorObject?.response?.data
                ?.message ||
              "Unable to load products and categories. Make sure the backend is running."
            }
            onRetry={handleRetry}
          />
        )}

        {!isLoading &&
          !isError &&
          products.length > 0 && (
            <>
              <section className="products-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </section>

              {pagination?.totalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    disabled={
                      !pagination.hasPreviousPage &&
                      page === 1
                    }
                    onClick={() => {
                      setPage((current) =>
                        Math.max(current - 1, 1)
                      );
                    }}
                  >
                    ← Previous
                  </button>

                  <span>
                    Page {pagination.page || page} of{" "}
                    {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      !pagination.hasNextPage &&
                      page >= pagination.totalPages
                    }
                    onClick={() => {
                      setPage((current) => current + 1);
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

        {!isLoading &&
          !isError &&
          products.length === 0 && (
            <div className="empty-state">
              <h2>No products found</h2>

              <p>
                Try a different search term or category.
              </p>
            </div>
          )}
      </div>
    </main>
  );
}