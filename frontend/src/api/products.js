import api from "./axios";

const getResponseData = (response) => {
  return response.data?.data ?? response.data;
};

export const getProducts = async (params = {}) => {
  const response = await api.get("/products", { params });

  return getResponseData(response);
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  const data = getResponseData(response);

  return data.product ?? data;
};