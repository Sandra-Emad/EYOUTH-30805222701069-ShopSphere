import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/axios";
import useAuth from "../hooks/useAuth";

const CartContext = createContext(null);

const extractCart = (data) => {
  return data?.cart ?? data?.data?.cart ?? data?.data ?? data;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get("/cart");
      const nextCart = extractCart(response.data);

      setCart(nextCart);

      return nextCart;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your cart."
      );

      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    // يمنع تحذير eslint الخاص باستدعاء setState بشكل مباشر من Effect.
    const timer = window.setTimeout(() => {
      fetchCart();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAuthenticated, fetchCart]);

  const updateCart = useCallback(async (request) => {
    setError("");

    try {
      const response = await request();
      const nextCart = extractCart(response.data);

      setCart(nextCart);

      return nextCart;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Your cart could not be updated.";

      setError(message);

      throw err;
    }
  }, []);

  const addToCart = useCallback(
    (productId, quantity = 1) =>
      updateCart(() =>
        api.post("/cart/items", {
          productId,
          quantity,
        })
      ),
    [updateCart]
  );

  const updateQuantity = useCallback(
    (productId, quantity) =>
      updateCart(() =>
        api.patch(`/cart/items/${productId}`, {
          quantity,
        })
      ),
    [updateCart]
  );

  const removeFromCart = useCallback(
    (productId) =>
      updateCart(() =>
        api.delete(`/cart/items/${productId}`)
      ),
    [updateCart]
  );

  const clearCart = useCallback(
    () => updateCart(() => api.delete("/cart")),
    [updateCart]
  );

  const items = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    return cart?.items ?? [];
  }, [cart, isAuthenticated]);

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [items]
  );

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = item.product ?? item;
        const price = Number(product.price || 0);
        const quantity = Number(item.quantity || 0);

        return sum + price * quantity;
      }, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      cart,
      items,
      loading,
      error,
      itemCount,
      total,
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      cart,
      items,
      loading,
      error,
      itemCount,
      total,
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;