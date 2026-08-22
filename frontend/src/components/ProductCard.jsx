import { Link, useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80";

const getProductImage = (product) => {
  const firstImage = product?.images?.[0];

  if (typeof firstImage === "string") {
    return firstImage;
  }

  if (firstImage?.url) {
    return firstImage.url;
  }

  return (
    product?.imageUrl ||
    product?.image ||
    FALLBACK_IMAGE
  );
};

const formatMoney = (price) => {
  return `$${Number(price || 0).toFixed(2)}`;
};

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const stock = Number(
    product.stock ?? product.quantity ?? 0
  );

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await addToCart(product.id, 1);
    } catch {
      // CartContext يحتفظ برسالة الخطأ.
    }
  };

  return (
    <article className="product-card">
      <Link
        to={`/products/${product.id}`}
        className="product-image-wrapper"
      >
        <img
          src={getProductImage(product)}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </Link>

      <div className="product-card-content">
        <span className="category-label">
          {product.category?.name || "Featured"}
        </span>

        <h3>
          <Link to={`/products/${product.id}`}>
            {product.name}
          </Link>
        </h3>

        <p>
          {product.description ||
            "Discover this carefully selected product."}
        </p>

        <div className="card-footer">
          <strong>{formatMoney(product.price)}</strong>

          <div className="card-actions">
            <Link
              to={`/products/${product.id}`}
              className="btn btn-outline"
            >
              Details
            </Link>

            <button
              type="button"
              className="btn btn-primary"
              disabled={stock <= 0}
              onClick={handleAddToCart}
            >
              {stock <= 0 ? "Out of stock" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}