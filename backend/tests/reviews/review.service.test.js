import { jest } from "@jest/globals";

import reviewService from "../../src/services/review.service.js";

describe("Review Service", () => {
  const database = {
    product: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exports", () => {
    test("should export all required methods", () => {
      expect(reviewService.listReviews).toEqual(
        expect.any(Function)
      );

      expect(reviewService.createReview).toEqual(
        expect.any(Function)
      );

      expect(reviewService.deleteReview).toEqual(
        expect.any(Function)
      );
    });
  });

  describe("listReviews", () => {
    test("should reject an invalid product ID", async () => {
      await expect(
        reviewService.listReviews("abc", database)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid product ID",
      });
    });

    test("should reject when the product does not exist", async () => {
      database.product.findUnique.mockResolvedValue(null);

      await expect(
        reviewService.listReviews(999, database)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Product not found",
      });
    });
  });

  describe("createReview", () => {
    test("should reject an invalid product ID", async () => {
      await expect(
        reviewService.createReview(
          "abc",
          1,
          {
            rating: 5,
            comment: "Great product",
          },
          database
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid product ID",
      });
    });

    test("should reject an invalid user ID", async () => {
      await expect(
        reviewService.createReview(
          1,
          "abc",
          {
            rating: 5,
            comment: "Great product",
          },
          database
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid user ID",
      });
    });

    test("should reject a rating below 1", async () => {
      database.product.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        reviewService.createReview(
          1,
          1,
          {
            rating: 0,
            comment: "Bad rating",
          },
          database
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Rating must be an integer between 1 and 5",
      });
    });

    test("should reject a rating above 5", async () => {
      database.product.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        reviewService.createReview(
          1,
          1,
          {
            rating: 6,
            comment: "Bad rating",
          },
          database
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Rating must be an integer between 1 and 5",
      });
    });

    test("should reject a non-integer rating", async () => {
      database.product.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        reviewService.createReview(
          1,
          1,
          {
            rating: 4.5,
            comment: "Good product",
          },
          database
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Rating must be an integer between 1 and 5",
      });
    });

    test("should reject a missing comment", async () => {
      database.product.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        reviewService.createReview(
          1,
          1,
          {
            rating: 5,
          },
          database
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Comment is required",
      });
    });

    test("should reject an empty comment", async () => {
      database.product.findUnique.mockResolvedValue({
        id: 1,
      });

      await expect(
        reviewService.createReview(
          1,
          1,
          {
            rating: 5,
            comment: "   ",
          },
          database
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Comment is required",
      });
    });
  });

  describe("deleteReview", () => {
    test("should reject an invalid review ID", async () => {
      await expect(
        reviewService.deleteReview(
          "invalid-review-id",
          1
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid review ID",
      });
    });
  });
});