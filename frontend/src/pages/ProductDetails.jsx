import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import { useProduct } from "../hooks/useProducts";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80";

const getProductImage = (product) => {
  const firstImage = product?.images?.[0];

  if (typeof firstImage === "string") {
    return firstImage;
  }

  return (
    firstImage?.url ||
    product?.imageUrl ||
    product?.image ||
    FALLBACK_IMAGE
  );
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [adding, setAdding] = useState(false);

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useProduct(id);

  if (isLoading) {
    return (
      <main className="page">
        <Loader text="Loading product..." />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="page">
        <div className="container">
          <ErrorMessage
            message={
              error?.response?.data?.message ||
              "Product could not be found."
            }
            onRetry={refetch}
          />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="page">
        <div className="container empty-state">
          <h2>Product not found</h2>

          <p>
            The product you are looking for does not exist.
          </p>

          <Link className="btn btn-primary" to="/products">
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  const stock = Number(
    product.stock ?? product.quantity ?? 1
  );

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setAdding(true);

    try {
      await addToCart(product.id, 1);
    } catch {
      // CartContext stores the API error.
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="page">
      <div className="container">
        <Link className="back-link" to="/products">
          ← Back to products
        </Link>

        <section className="product-details">
          <div className="product-details-image">
            <img
              src={getProductImage(product)}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>

          <div className="product-details-info">
            <span className="eyebrow">
              {product.category?.name || "Product"}
            </span>

            <h1>{product.name}</h1>

            <div className="details-price">
              ${Number(product.price || 0).toFixed(2)}
            </div>

            <p className="details-description">
              {product.description ||
                "No description is available for this product."}
            </p>

            <div className="product-meta">
              <div>
                <span>Availability</span>

                <strong
                  className={
                    stock > 0
                      ? "available"
                      : "unavailable"
                  }
                >
                  {stock > 0
                    ? `${stock} in stock`
                    : "Out of stock"}
                </strong>
              </div>

              <div>
                <span>Product ID</span>
                <strong>#{product.id}</strong>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-large"
              disabled={stock <= 0 || adding}
              onClick={handleAddToCart}
            >
              {adding
                ? "Adding..."
                : stock > 0
                  ? "Add to cart"
                  : "Out of stock"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}