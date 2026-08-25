import { useQuery } from "@tanstack/react-query";
import getCategories from "../api/categories";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });
};

export default useCategories;