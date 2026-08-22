export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80";

export const getProductImage = (product) => {
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

export const formatMoney = (price) => {
  return `$${Number(price || 0).toFixed(2)}`;
};

export const getProductStock = (product) => {
  return Number(
    product?.stock ?? product?.quantity ?? 0
  );
};