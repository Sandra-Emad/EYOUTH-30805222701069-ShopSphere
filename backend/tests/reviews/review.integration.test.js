import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import app from "../../src/app.js";
import prisma from "../../src/config/test-prisma.js";
import Review from "../../src/models/review.model.js";

import {
  connectMongoDB,
  disconnectMongoDB,
} from "../../src/config/mongodb.js";

const uniqueValue = () =>
  `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;

describe("Review API Integration", () => {
  let user;
  let secondUser;
  let product;
  let token;
  let secondToken;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      process.env.JWT_SECRET ||
      "test-jwt-secret";

    await connectMongoDB();

    await prisma.$connect();

    const suffix = uniqueValue();

    user = await prisma.user.create({
      data: {
        name: `Review Test User ${suffix}`,
        email: `review.user.${suffix}@example.com`,
        password: "TestPassword123!",
        role: "CUSTOMER",
      },
    });

    secondUser = await prisma.user.create({
      data: {
        name: `Review Test User 2 ${suffix}`,
        email: `review.user2.${suffix}@example.com`,
        password: "TestPassword123!",
        role: "CUSTOMER",
      },
    });

    const category = await prisma.category.create({
      data: {
        name: `Review Category ${suffix}`,
      },
    });

    product = await prisma.product.create({
      data: {
        name: `Review Test Product ${suffix}`,
        description:
          "Product used for review integration tests",
        price: 199.99,
        stock: 20,
        categoryId: category.id,
      },
    });

    token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET
    );

    secondToken = jwt.sign(
      {
        userId: secondUser.id,
        role: secondUser.role,
      },
      process.env.JWT_SECRET
    );

    await Review.deleteMany({
      productId: product.id,
    });
  }, 30000);

  afterAll(async () => {
    try {
      if (product?.id) {
        await Review.deleteMany({
          productId: product.id,
        });
      }

      if (product?.id) {
        await prisma.product.delete({
          where: {
            id: product.id,
          },
        });
      }

      if (user?.id) {
        await prisma.user.delete({
          where: {
            id: user.id,
          },
        });
      }

      if (secondUser?.id) {
        await prisma.user.delete({
          where: {
            id: secondUser.id,
          },
        });
      }
    } finally {
      await prisma.$disconnect();

      await prisma.$disconnect();
      await disconnectMongoDB();
    }
  }, 30000);

  test(
    "should reject unauthenticated review creation",
    async () => {
      const response = await request(app)
        .post(
          `/api/reviews/products/${product.id}`
        )
        .send({
          rating: 5,
          comment: "Excellent product",
        });

      expect(response.status).toBe(401);

      expect(response.body).toHaveProperty(
        "message"
      );
    },
    30000
  );

  test(
    "should return an empty review list for a product",
    async () => {
      await Review.deleteMany({
        productId: product.id,
      });

      const response = await request(app).get(
        `/api/reviews/products/${product.id}`
      );

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        reviews: [],
        count: 0,
        averageRating: 0,
      });
    },
    30000
  );

  test(
    "should create a review successfully",
    async () => {
      const response = await request(app)
        .post(
          `/api/reviews/products/${product.id}`
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          rating: 5,
          comment: "Excellent product",
        });

      expect(response.status).toBe(201);

      expect(response.body.message).toBe(
        "Review added successfully"
      );

      expect(response.body.review).toBeDefined();

      expect(
        response.body.review.productId
      ).toBe(product.id);

      expect(
        response.body.review.userId
      ).toBe(user.id);

      expect(
        response.body.review.rating
      ).toBe(5);

      expect(
        response.body.review.comment
      ).toBe("Excellent product");

      const savedReview = await Review.findOne({
        productId: product.id,
        userId: user.id,
      }).lean();

      expect(savedReview).not.toBeNull();

      expect(savedReview.rating).toBe(5);

      expect(savedReview.comment).toBe(
        "Excellent product"
      );
    },
    30000
  );

  test(
    "should return the created review through GET",
    async () => {
      const response = await request(app).get(
        `/api/reviews/products/${product.id}`
      );

      expect(response.status).toBe(200);

      expect(response.body.count).toBe(1);

      expect(response.body.averageRating).toBe(5);

      expect(response.body.reviews).toHaveLength(1);

      expect(
        response.body.reviews[0].productId
      ).toBe(product.id);

      expect(
        response.body.reviews[0].userId
      ).toBe(user.id);

      expect(
        response.body.reviews[0].rating
      ).toBe(5);

      expect(
        response.body.reviews[0].comment
      ).toBe("Excellent product");
    },
    30000
  );

  test(
    "should update the review when requested by its owner",
    async () => {
      const review = await Review.findOne({
        productId: product.id,
        userId: user.id,
      }).lean();

      expect(review).not.toBeNull();

      const response = await request(app)
        .patch(`/api/reviews/${review._id}`)
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          rating: 4,
          comment: "Updated review",
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(
        response.body.review.rating
      ).toBe(4);

      expect(
        response.body.review.comment
      ).toBe("Updated review");

      const saved = await Review.findById(
        review._id
      ).lean();

      expect(saved.rating).toBe(4);

      expect(saved.comment).toBe(
        "Updated review"
      );
    },
    30000
  );

  test(
    "should reject updating another user's review",
    async () => {
      const review = await Review.findOne({
        productId: product.id,
        userId: user.id,
      }).lean();

      expect(review).not.toBeNull();

      const response = await request(app)
        .patch(`/api/reviews/${review._id}`)
        .set(
          "Authorization",
          `Bearer ${secondToken}`
        )
        .send({
          rating: 2,
          comment: "Unauthorized update",
        });

      expect(response.status).toBe(403);

      expect(response.body.message).toBe(
        "You are not allowed to update this review"
      );
    },
    30000
  );

  test(
    "should reject a duplicate review from the same user",
    async () => {
      const response = await request(app)
        .post(
          `/api/reviews/products/${product.id}`
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          rating: 4,
          comment: "Trying to review again",
        });

      expect(response.status).toBe(409);

      expect(response.body.message).toBe(
        "You have already reviewed this product"
      );
    },
    30000
  );

  test(
    "should allow another user to review the same product",
    async () => {
      const response = await request(app)
        .post(
          `/api/reviews/products/${product.id}`
        )
        .set(
          "Authorization",
          `Bearer ${secondToken}`
        )
        .send({
          rating: 3,
          comment: "Good product",
        });

      expect(response.status).toBe(201);

      expect(
        response.body.review.userId
      ).toBe(secondUser.id);

      expect(
        response.body.review.rating
      ).toBe(3);
    },
    30000
  );

  test(
    "should calculate the correct average rating",
    async () => {
      const response = await request(app).get(
        `/api/reviews/products/${product.id}`
      );

      expect(response.status).toBe(200);

      expect(response.body.count).toBe(2);

      expect(response.body.averageRating).toBe(3.5);

      expect(response.body.reviews).toHaveLength(2);
    },
    30000
  );

  test(
    "should reject an invalid product ID",
    async () => {
      const response = await request(app).get(
        "/api/reviews/products/not-a-number"
      );

      expect(response.status).toBe(400);

      expect(response.body.message).toBe(
        "Invalid product ID"
      );
    },
    30000
  );

  test(
    "should return 404 for a non-existing product",
    async () => {
      const response = await request(app).get(
        "/api/reviews/products/999999999"
      );

      expect(response.status).toBe(404);

      expect(response.body.message).toBe(
        "Product not found"
      );
    },
    30000
  );

  test(
    "should reject an invalid rating",
    async () => {
      const response = await request(app)
        .post(
          `/api/reviews/products/${product.id}`
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          rating: 10,
          comment: "Invalid rating",
        });

      expect(response.status).toBe(400);

      expect(response.body.message).toBe(
        "Validation failed"
      );

      expect(
        response.body.errors[0].message
      ).toBe(
        "Rating must be an integer between 1 and 5"
      );
    },
    30000
  );

  test(
    "should reject a missing comment",
    async () => {
      const response = await request(app)
        .post(
          `/api/reviews/products/${product.id}`
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          rating: 4,
        });

      expect(response.status).toBe(400);

      expect(response.body.message).toBe(
        "Validation failed"
      );

      expect(
        response.body.errors[0].message
      ).toBe("Comment is required");
    },
    30000
  );

  test(
    "should reject an unauthenticated delete request",
    async () => {
      const review = await Review.findOne({
        productId: product.id,
        userId: user.id,
      }).lean();

      expect(review).not.toBeNull();

      const response = await request(app).delete(
        `/api/reviews/${review._id}`
      );

      expect(response.status).toBe(401);
    },
    30000
  );

  test(
    "should reject deleting another user's review",
    async () => {
      const review = await Review.findOne({
        productId: product.id,
        userId: user.id,
      }).lean();

      expect(review).not.toBeNull();

      const response = await request(app)
        .delete(`/api/reviews/${review._id}`)
        .set(
          "Authorization",
          `Bearer ${secondToken}`
        );

      expect(response.status).toBe(403);

      expect(response.body.message).toBe(
        "You are not allowed to delete this review"
      );
    },
    30000
  );

  test(
    "should delete a review successfully",
    async () => {
      const review = await Review.findOne({
        productId: product.id,
        userId: user.id,
      }).lean();

      expect(review).not.toBeNull();

      const response = await request(app)
        .delete(`/api/reviews/${review._id}`)
        .set(
          "Authorization",
          `Bearer ${token}`
        );

      expect(response.status).toBe(200);

      expect(response.body.message).toBe(
        "Review deleted successfully"
      );

      const deletedReview =
        await Review.findById(review._id);

      expect(deletedReview).toBeNull();
    },
    30000
  );
});