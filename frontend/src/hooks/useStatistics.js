import { useQuery } from "@tanstack/react-query";
import getStatistics from "../api/statistics";

export const useStatistics = () => {
  return useQuery({
    queryKey: ["statistics"],
    queryFn: getStatistics,
    staleTime: 30 * 1000,
  });
};

export default useStatistics;