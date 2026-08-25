import api from "./axios";

export const getStatistics = async () => {
  const response = await api.get("/statistics");

  return response.data;
};

export default getStatistics;