import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();

app.use(cors());
app.use(express.json());

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      required: true
    },
    userId: {
      type: Number,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index(
  { productId: 1, userId: 1 },
  { unique: true }
);

const Review =
  mongoose.models.Review ||
  mongoose.model("Review", reviewSchema);

let connected = false;

const getAuthenticatedUserId = (req) => {
  const userId = Number(req.headers["x-user-id"]);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

async function connectDatabase() {
  if (connected) return;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(uri);
  connected = true;
}

app.get("/api/health", async (req, res) => {
  try {
    await connectDatabase();

    res.status(200).json({
      success: true,
      service: "shopsphere-review-service",
      status: "healthy"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get("/api/reviews/products/:productId", async (req, res) => {
  try {
    await connectDatabase();

    const productId = Number(req.params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    const ratings = reviews.map((review) => review.rating);

    const averageRating =
      ratings.length > 0
        ? Number(
            (
              ratings.reduce(
                (sum, rating) => sum + rating,
                0
              ) / ratings.length
            ).toFixed(2)
          )
        : 0;

    return res.status(200).json({
      reviews,
      count: reviews.length,
      averageRating
    });
  } catch (error) {
    console.error("Review service error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get reviews"
    });
  }
});

app.post("/api/reviews/products/:productId", async (req, res) => {
  try {
    await connectDatabase();

    const productId = Number(req.params.productId);
    const userId = Number(req.headers["x-user-id"]);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5"
      });
    }

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "Comment is required"
      });
    }

    if (comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment must not exceed 1000 characters"
      });
    }

    const existingReview = await Review.findOne({
      productId,
      userId
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product"
      });
    }

    const review = await Review.create({
      productId,
      userId,
      rating,
      comment
    });

    return res.status(201).json({
      message: "Review added successfully",
      review: review.toObject()
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product"
      });
    }

    console.error("Create review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create review"
    });
  }
});

app.patch("/api/reviews/:reviewId", async (req, res) => {
  try {
    await connectDatabase();

    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID"
      });
    }

    const updateData = {};

    if (req.body?.rating !== undefined) {
      const rating = Number(req.body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be an integer between 1 and 5"
        });
      }
      updateData.rating = rating;
    }

    if (req.body?.comment !== undefined) {
      const comment = String(req.body.comment || "").trim();
      if (!comment) {
        return res.status(400).json({
          success: false,
          message: "Comment is required"
        });
      }
      if (comment.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Comment must not exceed 1000 characters"
        });
      }
      updateData.comment = comment;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one review field is required"
      });
    }

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!review) {
      const exists = await Review.exists({ _id: reviewId });
      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not allowed to update this review"
          : "Review not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review
    });
  } catch (error) {
    console.error("Update review error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review"
    });
  }
});

app.delete("/api/reviews/:reviewId", async (req, res) => {
  try {
    await connectDatabase();

    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID"
      });
    }

    const review = await Review.findOne({
      _id: reviewId,
      userId
    });

    if (!review) {
      const exists = await Review.exists({ _id: reviewId });
      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not allowed to delete this review"
          : "Review not found"
      });
    }

    await Review.deleteOne({ _id: reviewId, userId });

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Delete review error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review"
    });
  }
});

export default app;

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5001;

  app.listen(port, () => {
    console.log(
      `Review service running on http://localhost:${port}`
    );
  });
}
