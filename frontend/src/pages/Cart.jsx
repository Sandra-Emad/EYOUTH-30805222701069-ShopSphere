import { Link } from "react-router-dom";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import useCart from "../hooks/useCart";

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

const formatMoney = (price) => {
  return `$${Number(price || 0).toFixed(2)}`;
};

export default function Cart() {
  const {
    items,
    total,
    loading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  if (loading && items.length === 0) {
    return (
      <main className="page">
        <Loader text="Loading your cart..." />
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <section className="page-heading">
          <span className="eyebrow">Your selections</span>
          <h1>Shopping cart</h1>
        </section>

        {error && <ErrorMessage message={error} />}

        {items.length === 0 ? (
          <div className="empty-state">
            <h2>Your cart is empty</h2>

            <p>
              Find something special in our collection.
            </p>

            <Link to="/products" className="btn btn-primary">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              {items.map((item) => {
                const product = item.product ?? item;
                const productId =
                  product.id ?? item.productId;

                return (
                  <article
                    className="cart-item"
                    key={item.id ?? productId}
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.src =
                          FALLBACK_IMAGE;
                      }}
                    />

                    <div className="cart-item-info">
                      <Link to={`/products/${productId}`}>
                        <h2>{product.name}</h2>
                      </Link>

                      <p>{formatMoney(product.price)}</p>

                      <div className="quantity-control">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeFromCart(productId);
                              return;
                            }

                            updateQuantity(
                              productId,
                              item.quantity - 1
                            );
                          }}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => {
                            updateQuantity(
                              productId,
                              item.quantity + 1
                            );
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-side">
                      <strong>
                        {formatMoney(
                          Number(product.price || 0) *
                            Number(item.quantity || 0)
                        )}
                      </strong>

                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => {
                          removeFromCart(productId);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="cart-summary">
              <h2>Order summary</h2>

              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(total)}</strong>
              </div>

              <div>
                <span>Shipping</span>
                <span>Calculated later</span>
              </div>

              <hr />

              <div className="summary-total">
                <span>Total</span>
                <strong>{formatMoney(total)}</strong>
              </div>

              <button
                type="button"
                className="btn btn-text"
                onClick={clearCart}
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}