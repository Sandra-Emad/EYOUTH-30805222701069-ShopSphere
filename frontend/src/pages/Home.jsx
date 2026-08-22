import { Link } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { useProducts } from "../hooks/useProducts";

export default function Home() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useProducts({
    page: 1,
    limit: 4,
  });

  const products =
    data?.products ??
    data?.data?.products ??
    (Array.isArray(data) ? data : []);

  return (
    <main>
      <section className="hero">
        <div className="container hero-content">
          <div>
            <span className="eyebrow">
              Everything you need, in one place
            </span>

            <h1>Shop smarter. Live better.</h1>

            <p>
              Discover products picked for everyday life,
              with a smooth shopping experience from browse
              to cart.
            </p>

            <div className="hero-actions">
              <Link
                className="btn btn-primary btn-large"
                to="/products"
              >
                Shop collection
              </Link>

              <Link
                className="btn btn-light btn-large"
                to="/products"
              >
                Explore products
              </Link>
            </div>
          </div>

          <div className="hero-card">
            <span>NEW ARRIVALS</span>
            <strong>Made for your everyday.</strong>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              Popular right now
            </span>

            <h2>Featured products</h2>
          </div>

          <Link to="/products" className="text-link">
            View all products →
          </Link>
        </div>

        {isLoading && (
          <Loader text="Loading featured products..." />
        )}

        {isError && (
          <ErrorMessage
            message={
              error?.response?.data?.message ||
              "Unable to load products."
            }
            onRetry={refetch}
          />
        )}

        {!isLoading && !isError && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <div className="empty-state">
            <h2>New products are coming soon</h2>
            <p>
              Check back shortly to browse our store.
            </p>
          </div>
        )}
      </section>

      <section className="container promotion-card">
        <div>
          <span className="eyebrow">
            Simple shopping
          </span>

          <h2>Find something you’ll love.</h2>

          <p>
            Browse the full catalog, see every detail, and
            add products to your cart in seconds.
          </p>
        </div>

        <Link to="/products" className="btn btn-light">
          Start browsing
        </Link>
      </section>
    </main>
  );
}