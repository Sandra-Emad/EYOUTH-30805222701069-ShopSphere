import api from "./axios";

export const getReviews = async (productId) => {
  const response = await api.get(`/reviews/products/${productId}`);
  return response.data;
};

export const createReview = async (productId, data) => {
  const response = await api.post(
    `/reviews/products/${productId}`,
    data
  );

  return response.data;
};

export const updateReview = async (reviewId, data) => {
  const response = await api.patch(
    `/reviews/${reviewId}`,
    data
  );

  return response.data;
};

export const deleteReview = async (reviewId) => {
  const response = await api.delete(
    `/reviews/${reviewId}`
  );

  return response.data;
};
