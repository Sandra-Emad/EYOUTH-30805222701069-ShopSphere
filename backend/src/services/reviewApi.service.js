const getReviewServiceUrl = () => {
  const url =
    process.env.REVIEW_SERVICE_URL ||
    "https://eyouth-30805222701069-shopsphere-review-service-fmskkegrc.vercel.app";

  return url.replace(/\/+$/, "");
};

const requestReviewService = async (
  path,
  options = {}
) => {
  const response = await fetch(
    `${getReviewServiceUrl()}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      success: false,
      message: text || "Invalid response from review service",
    };
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        "Review service request failed"
    );

    error.statusCode = response.status;

    throw error;
  }

  return data;
};

export const getReviewsFromService = async (
  productId
) => {
  return requestReviewService(
    `/api/reviews/products/${productId}`
  );
};

export const createReviewInService = async (
  productId,
  userId,
  data
) => {
  return requestReviewService(
    `/api/reviews/products/${productId}`,
    {
      method: "POST",
      headers: {
        "x-user-id": String(userId),
      },
      body: JSON.stringify(data),
    }
  );
};

export default {
  getReviewsFromService,
  createReviewInService,
};
