import prisma from "../config/prisma.js";

const getReviewServiceUrl = () => {
  const url = process.env.REVIEW_SERVICE_URL;

  if (!url) {
    throw new Error("REVIEW_SERVICE_URL is not configured");
  }

  return url.replace(/\/+$/, "");
};

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateProductId = (productId) => {
  const id = Number(productId);

  if (!Number.isInteger(id) || id <= 0) {
    throw createError("Invalid product ID", 400);
  }

  return id;
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
      data?.message || "Review service request failed"
    );

    error.statusCode = response.status;

    throw error;
  }

  return data;
};

export const getReviewsFromService = async (
  productId,
  database = prisma
) => {
  const id = validateProductId(productId);

  const product = await database.product.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    throw createError("Product not found", 404);
  }

  return requestReviewService(
    `/api/reviews/products/${id}`
  );
};

export const updateReviewInService = async (
  reviewId,
  userId,
  data
) => {
  return requestReviewService(
    `/api/reviews/${reviewId}`,
    {
      method: "PATCH",
      headers: {
        "x-user-id": String(userId),
      },
      body: JSON.stringify(data),
    }
  );
};

export const deleteReviewInService = async (
  reviewId,
  userId
) => {
  return requestReviewService(
    `/api/reviews/${reviewId}`,
    {
      method: "DELETE",
      headers: {
        "x-user-id": String(userId),
      },
    }
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
  updateReviewInService,
  deleteReviewInService,
};