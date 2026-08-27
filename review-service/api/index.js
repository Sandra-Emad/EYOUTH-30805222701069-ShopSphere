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

export default app;

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5001;

  app.listen(port, () => {
    console.log(
      `Review service running on http://localhost:${port}`
    );
  });
}
