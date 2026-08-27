import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from "vitest";

import ProductDetails from "./ProductDetails";

vi.mock("../hooks/useProducts", () => ({
  useProduct: vi.fn(),
}));

vi.mock("../hooks/useAuth", () => ({
  default: vi.fn(),
}));

vi.mock("../hooks/useCart", () => ({
  default: vi.fn(),
}));

vi.mock("../hooks/useReviews", () => ({
  useReviews: vi.fn(),
  useCreateReview: vi.fn(),
  useUpdateReview: vi.fn(),
  useDeleteReview: vi.fn(),
}));

import { useProduct } from "../hooks/useProducts";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import {
  useReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "../hooks/useReviews";

const product = {
  id: 1,
  name: "iPhone 15",
  price: 999,
  stock: 10,
  description: "Latest Apple smartphone",
  category: {
    name: "Phones",
  },
  imageUrl: "https://example.com/phone.jpg",
};

const review = {
  _id: "review-1",
  productId: 1,
  userId: 7,
  rating: 5,
  comment: "Excellent product",
  createdAt: "2026-08-20T10:00:00.000Z",
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

const renderDetails = () => {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/products/1"]}>
        <ProductDetails />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const setupAuthenticatedUser = () => {
  useAuth.mockReturnValue({
    user: {
      id: 7,
      name: "Sandra",
    },
    isAuthenticated: true,
  });
};

const setupReviews = (overrides = {}) => {
  useReviews.mockReturnValue({
    data: {
      reviews: [],
      count: 0,
      averageRating: 0,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  });
};

describe("ProductDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useCreateReview.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    });

    useUpdateReview.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    });

    useDeleteReview.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    });
  });

  it("shows loading state", () => {
    useProduct.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    setupAuthenticatedUser();
    setupReviews();

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByText("Loading product...")
    ).toBeInTheDocument();
  });

  it("shows product information", () => {
    useProduct.mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    setupAuthenticatedUser();
    setupReviews();

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByRole("heading", {
        name: "iPhone 15",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("$999.00")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Latest Apple smartphone")
    ).toBeInTheDocument();

    expect(
      screen.getByText("10 in stock")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Add to cart",
      })
    ).toBeEnabled();
  });

  it("shows out of stock state", () => {
    useProduct.mockReturnValue({
      data: {
        ...product,
        stock: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    setupAuthenticatedUser();
    setupReviews();

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    const button = screen.getByRole("button", {
      name: "Out of stock",
    });

    expect(button).toBeDisabled();
  });

  it("shows error state", () => {
    useProduct.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: {
        response: {
          data: {
            message: "Product not found",
          },
        },
      },
      refetch: vi.fn(),
    });

    setupAuthenticatedUser();
    setupReviews();

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByText("Product not found")
    ).toBeInTheDocument();
  });

  it("shows not found state when product is null", () => {
    useProduct.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    setupAuthenticatedUser();
    setupReviews();

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByText("Product not found")
    ).toBeInTheDocument();
  });

  it("shows reviews and average rating", () => {
    useProduct.mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    setupAuthenticatedUser();

    setupReviews({
      data: {
        reviews: [review],
        count: 1,
        averageRating: 5,
      },
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByRole("heading", {
        name: "Reviews",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Excellent product")
    ).toBeInTheDocument();

    expect(
      screen.getByText("5.0")
    ).toBeInTheDocument();

    expect(
      screen.getByText("1 review")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "You have already reviewed this product"
      )
    ).toBeInTheDocument();
  });

  it("allows an authenticated user to create a review", async () => {
    useProduct.mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    setupAuthenticatedUser();
    setupReviews();

    const mutateAsync = vi.fn().mockResolvedValue({
      ...review,
    });

    useCreateReview.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    fireEvent.change(
      screen.getByLabelText("Rating"),
      {
        target: {
          value: "4",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText("Comment"),
      {
        target: {
          value: "Very good product",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Submit review",
      })
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        rating: 4,
        comment: "Very good product",
      });
    });
  });

  it("shows login link for unauthenticated users", () => {
    useProduct.mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    setupReviews();

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.getByRole("link", {
        name: "Login to review",
      })
    ).toHaveAttribute("href", "/login");

    expect(
      screen.queryByRole("button", {
        name: "Submit review",
      })
    ).not.toBeInTheDocument();
  });

  it("allows the review owner to edit a review", async () => {
    useProduct.mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    setupAuthenticatedUser();

    setupReviews({
      data: {
        reviews: [review],
        count: 1,
        averageRating: 5,
      },
    });

    const mutateAsync = vi.fn().mockResolvedValue({
      ...review,
      rating: 4,
      comment: "Updated review",
    });

    useUpdateReview.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit",
      })
    );

    expect(
      screen.getByText("Edit your review")
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("Comment"),
      {
        target: {
          value: "Updated review",
        },
      }
    );

    fireEvent.change(
      screen.getByLabelText("Rating"),
      {
        target: {
          value: "4",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save changes",
      })
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        reviewId: "review-1",
        data: {
          rating: 4,
          comment: "Updated review",
        },
      });
    });
  });

  it("allows the review owner to delete a review", async () => {
    useProduct.mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    setupAuthenticatedUser();

    setupReviews({
      data: {
        reviews: [review],
        count: 1,
        averageRating: 5,
      },
    });

    const mutateAsync = vi.fn().mockResolvedValue({
      message: "Review deleted successfully",
    });

    useDeleteReview.mockReturnValue({
      mutateAsync,
      isPending: false,
      error: null,
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDetails();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete",
      })
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        "review-1"
      );
    });

    window.confirm.mockRestore();
  });

  it("does not show edit or delete controls for another user's review", () => {
    useProduct.mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    useAuth.mockReturnValue({
      user: {
        id: 99,
        name: "Other user",
      },
      isAuthenticated: true,
    });

    setupReviews({
      data: {
        reviews: [review],
        count: 1,
        averageRating: 5,
      },
    });

    useCart.mockReturnValue({
      addToCart: vi.fn(),
    });

    renderDetails();

    expect(
      screen.queryByRole("button", {
        name: "Edit",
      })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Delete",
      })
    ).not.toBeInTheDocument();
  });
});