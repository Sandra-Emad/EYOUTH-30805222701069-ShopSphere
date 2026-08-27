import { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import { useProduct } from "../hooks/useProducts";
import {
  useReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "../hooks/useReviews";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80";

const getProductImage = (product) => {
  const firstImage = product?.images?.[0];

  if (typeof firstImage === "string") {
    return firstImage;
  }

  return (
    firstImage?.url ||
    product?.imageUrl ||
    product?.image ||
    FALLBACK_IMAGE
  );
};

const getReviewUserId = (review) =>
  review?.userId ??
  review?.user?.id ??
  review?.user?.userId ??
  null;

const getReviewId = (review) =>
  review?._id ??
  review?.id ??
  null;

const getReviewDate = (review) => {
  if (!review?.createdAt) {
    return "";
  }

  const date = new Date(review.createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString();
};

const renderStars = (rating) => {
  const value = Number(rating) || 0;

  return (
    <span
      className="review-stars"
      aria-label={`${value} out of 5 stars`}
    >
      {"★".repeat(value)}
      {"☆".repeat(Math.max(0, 5 - value))}
    </span>
  );
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [adding, setAdding] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [editingReviewId, setEditingReviewId] =
    useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useProduct(id);

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    isError: reviewsError,
    refetch: refetchReviews,
  } = useReviews(id);

  const createReviewMutation =
    useCreateReview(id);

  const updateReviewMutation =
    useUpdateReview(id);

  const deleteReviewMutation =
    useDeleteReview(id);

  const reviews = useMemo(() => {
    if (Array.isArray(reviewsData)) {
      return reviewsData;
    }

    if (Array.isArray(reviewsData?.reviews)) {
      return reviewsData.reviews;
    }

    if (Array.isArray(reviewsData?.data?.reviews)) {
      return reviewsData.data.reviews;
    }

    return [];
  }, [reviewsData]);

  const averageRating = Number(
    reviewsData?.averageRating ??
      reviewsData?.data?.averageRating ??
      0
  );

  const reviewCount = Number(
    reviewsData?.count ??
      reviewsData?.data?.count ??
      reviews.length
  );

  const currentUserId = user?.id ?? user?.userId ?? null;

  const currentUserReview = reviews.find(
    (review) =>
      String(getReviewUserId(review)) ===
      String(currentUserId)
  );

  if (isLoading) {
    return (
      <main className="page">
        <Loader text="Loading product..." />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="page">
        <div className="container">
          <ErrorMessage
            message={
              error?.response?.data?.message ||
              "Product could not be found."
            }
            onRetry={refetch}
          />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="page">
        <div className="container empty-state">
          <h2>Product not found</h2>

          <p>
            The product you are looking for does not exist.
          </p>

          <Link
            className="btn btn-primary"
            to="/products"
          >
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  const stock = Number(
    product.stock ?? product.quantity ?? 1
  );

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setAdding(true);

    try {
      await addToCart(product.id, 1);
    } catch {
      // CartContext stores the API error.
    } finally {
      setAdding(false);
    }
  };

  const handleCreateReview = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (currentUserReview) {
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        rating: Number(rating),
        comment: comment.trim(),
      });

      setRating(5);
      setComment("");
    } catch {
      // Mutation error is exposed by React Query.
    }
  };

  const startEditing = (review) => {
    setEditingReviewId(getReviewId(review));
    setEditRating(Number(review.rating) || 5);
    setEditComment(review.comment || "");
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment("");
  };

  const handleUpdateReview = async (event) => {
    event.preventDefault();

    if (!editingReviewId) {
      return;
    }

    try {
      await updateReviewMutation.mutateAsync({
        reviewId: editingReviewId,
        data: {
          rating: Number(editRating),
          comment: editComment.trim(),
        },
      });

      cancelEditing();
    } catch {
      // Mutation error is exposed by React Query.
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteReviewMutation.mutateAsync(
        reviewId
      );

      if (editingReviewId === reviewId) {
        cancelEditing();
      }
    } catch {
      // Mutation error is exposed by React Query.
    }
  };

  const reviewMutationError =
    createReviewMutation.error ||
    updateReviewMutation.error ||
    deleteReviewMutation.error;

  const reviewMutationMessage =
    reviewMutationError?.response?.data?.message ||
    reviewMutationError?.message;

  return (
    <main className="page">
      <div className="container">
        <Link
          className="back-link"
          to="/products"
        >
          ← Back to products
        </Link>

        <section className="product-details">
          <div className="product-details-image">
            <img
              src={getProductImage(product)}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.src =
                  FALLBACK_IMAGE;
              }}
            />
          </div>

          <div className="product-details-info">
            <span className="eyebrow">
              {product.category?.name || "Product"}
            </span>

            <h1>{product.name}</h1>

            <div className="details-price">
              ${Number(product.price || 0).toFixed(2)}
            </div>

            <p className="details-description">
              {product.description ||
                "No description is available for this product."}
            </p>

            <div className="product-meta">
              <div>
                <span>Availability</span>

                <strong
                  className={
                    stock > 0
                      ? "available"
                      : "unavailable"
                  }
                >
                  {stock > 0
                    ? `${stock} in stock`
                    : "Out of stock"}
                </strong>
              </div>

              <div>
                <span>Product ID</span>
                <strong>#{product.id}</strong>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-large"
              disabled={stock <= 0 || adding}
              onClick={handleAddToCart}
            >
              {adding
                ? "Adding..."
                : stock > 0
                  ? "Add to cart"
                  : "Out of stock"}
            </button>
          </div>
        </section>

        <section
          className="reviews-section"
          aria-labelledby="reviews-heading"
        >
          <div className="reviews-header">
            <div>
              <span className="eyebrow">
                Customer feedback
              </span>

              <h2 id="reviews-heading">
                Reviews
              </h2>
            </div>

            <div className="reviews-summary">
              <strong>
                {averageRating > 0
                  ? averageRating.toFixed(1)
                  : "0.0"}
              </strong>

              <span>
                {renderStars(
                  Math.round(averageRating)
                )}
              </span>

              <span>
                {reviewCount}{" "}
                {reviewCount === 1
                  ? "review"
                  : "reviews"}
              </span>
            </div>
          </div>

          {reviewsLoading && (
            <p className="reviews-status">
              Loading reviews...
            </p>
          )}

          {reviewsError && (
            <div className="reviews-status">
              <p>
                Reviews could not be loaded.
              </p>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={refetchReviews}
              >
                Retry
              </button>
            </div>
          )}

          {!reviewsLoading &&
            !reviewsError &&
            reviews.length === 0 && (
              <div className="reviews-empty">
                <h3>No reviews yet</h3>
                <p>
                  Be the first customer to review
                  this product.
                </p>
              </div>
            )}

          {!reviewsLoading &&
            !reviewsError &&
            reviews.length > 0 && (
              <div className="reviews-list">
                {reviews.map((review) => {
                  const reviewId =
                    getReviewId(review);

                  const isOwner =
                    isAuthenticated &&
                    currentUserId !== null &&
                    String(
                      getReviewUserId(review)
                    ) === String(currentUserId);

                  if (
                    editingReviewId === reviewId
                  ) {
                    return (
                      <article
                        className="review-card"
                        key={reviewId}
                      >
                        <form
                          onSubmit={
                            handleUpdateReview
                          }
                        >
                          <h3>Edit your review</h3>

                          <label>
                            Rating
                            <select
                              value={editRating}
                              onChange={(event) =>
                                setEditRating(
                                  Number(
                                    event.target
                                      .value
                                  )
                                )
                              }
                            >
                              <option value={5}>
                                5 - Excellent
                              </option>
                              <option value={4}>
                                4 - Very good
                              </option>
                              <option value={3}>
                                3 - Good
                              </option>
                              <option value={2}>
                                2 - Fair
                              </option>
                              <option value={1}>
                                1 - Poor
                              </option>
                            </select>
                          </label>

                          <label>
                            Comment
                            <textarea
                              value={editComment}
                              onChange={(event) =>
                                setEditComment(
                                  event.target
                                    .value
                                )
                              }
                              maxLength={1000}
                              required
                              rows={4}
                            />
                          </label>

                          <div className="review-actions">
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={
                                updateReviewMutation.isPending
                              }
                            >
                              {updateReviewMutation.isPending
                                ? "Saving..."
                                : "Save changes"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={
                                cancelEditing
                              }
                              disabled={
                                updateReviewMutation.isPending
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </article>
                    );
                  }

                  return (
                    <article
                      className="review-card"
                      key={reviewId}
                    >
                      <div className="review-card-header">
                        <div>
                          <strong>
                            {review?.user?.name ||
                              review?.user?.username ||
                              review?.userName ||
                              `User #${getReviewUserId(
                                review
                              )}`}
                          </strong>

                          <div>
                            {renderStars(
                              review.rating
                            )}
                          </div>
                        </div>

                        {getReviewDate(review) && (
                          <time>
                            {getReviewDate(review)}
                          </time>
                        )}
                      </div>

                      <p>{review.comment}</p>

                      {isOwner && (
                        <div className="review-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                              startEditing(review)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              handleDeleteReview(
                                reviewId
                              )
                            }
                            disabled={
                              deleteReviewMutation.isPending
                            }
                          >
                            {deleteReviewMutation.isPending
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

          <div className="review-form-section">
            <h3>
              {currentUserReview
                ? "You have already reviewed this product"
                : "Write a review"}
            </h3>

            {!isAuthenticated && (
              <p>
                Please log in to write a review.
              </p>
            )}

            {isAuthenticated &&
              !currentUserReview && (
                <form
                  className="review-form"
                  onSubmit={handleCreateReview}
                >
                  <label>
                    Rating
                    <select
                      value={rating}
                      onChange={(event) =>
                        setRating(
                          Number(
                            event.target.value
                          )
                        )
                      }
                    >
                      <option value={5}>
                        5 - Excellent
                      </option>
                      <option value={4}>
                        4 - Very good
                      </option>
                      <option value={3}>
                        3 - Good
                      </option>
                      <option value={2}>
                        2 - Fair
                      </option>
                      <option value={1}>
                        1 - Poor
                      </option>
                    </select>
                  </label>

                  <label>
                    Comment
                    <textarea
                      value={comment}
                      onChange={(event) =>
                        setComment(
                          event.target.value
                        )
                      }
                      maxLength={1000}
                      required
                      rows={5}
                      placeholder="Share your experience with this product..."
                    />
                  </label>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      createReviewMutation.isPending
                    }
                  >
                    {createReviewMutation.isPending
                      ? "Submitting..."
                      : "Submit review"}
                  </button>
                </form>
              )}

            {!isAuthenticated && (
              <Link
                className="btn btn-primary"
                to="/login"
              >
                Login to review
              </Link>
            )}

            {reviewMutationMessage && (
              <p
                className="review-form-error"
                role="alert"
              >
                {reviewMutationMessage}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}