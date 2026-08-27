import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../api/reviews";

export const useReviews = (productId) => {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => getReviews(productId),
    enabled: Boolean(productId),
    retry: false,
  });
};

export const useCreateReview = (productId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createReview(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", productId],
      });
    },
  });
};

export const useUpdateReview = (productId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, data }) =>
      updateReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", productId],
      });
    },
  });
};

export const useDeleteReview = (productId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", productId],
      });
    },
  });
};
