import { http, HttpResponse } from "msw";

const users = {
  customer: {
    id: 1,
    name: "Sandra",
    email: "sandra@example.com",
    role: "CUSTOMER",
  },
  admin: {
    id: 2,
    name: "Admin",
    email: "admin@example.com",
    role: "ADMIN",
  },
};

const tokens = {
  customer: "mock-customer-token",
  admin: "mock-admin-token",
};

let cart = {
  id: 1,
  items: [
    {
      id: 101,
      productId: 1,
      quantity: 2,
      product: {
        id: 1,
        name: "iPhone 15",
        price: 999,
        stock: 10,
      },
    },
    {
      id: 102,
      productId: 2,
      quantity: 1,
      product: {
        id: 2,
        name: "MacBook Air",
        price: 1299,
        stock: 5,
      },
    },
  ],
};

const products = [
  {
    id: 1,
    name: "iPhone 15",
    description: "Latest Apple smartphone",
    price: 999,
    stock: 10,
    category: {
      id: 1,
      name: "Phones",
    },
    images: [
      {
        id: 1,
        url: "https://example.com/iphone-15.jpg",
      },
    ],
  },
  {
    id: 2,
    name: "MacBook Air",
    description: "Lightweight Apple laptop",
    price: 1299,
    stock: 5,
    category: {
      id: 2,
      name: "Laptops",
    },
    images: [
      {
        id: 2,
        url: "https://example.com/macbook-air.jpg",
      },
    ],
  },
  {
    id: 3,
    name: "AirPods Pro",
    description: "Wireless noise cancelling earbuds",
    price: 249,
    stock: 20,
    category: {
      id: 3,
      name: "Accessories",
    },
    images: [
      {
        id: 3,
        url: "https://example.com/airpods-pro.jpg",
      },
    ],
  },
];

const getUserFromRequest = ({ request }) => {
  const authorization =
    request.headers.get("Authorization") || "";

  if (authorization === `Bearer ${tokens.admin}`) {
    return users.admin;
  }

  if (authorization === `Bearer ${tokens.customer}`) {
    return users.customer;
  }

  return null;
};

export const resetMockData = () => {
  cart = {
    id: 1,
    items: [
      {
        id: 101,
        productId: 1,
        quantity: 2,
        product: {
          id: 1,
          name: "iPhone 15",
          price: 999,
          stock: 10,
        },
      },
      {
        id: 102,
        productId: 2,
        quantity: 1,
        product: {
          id: 2,
          name: "MacBook Air",
          price: 1299,
          stock: 5,
        },
      },
    ],
  };
};

export const handlers = [
  // =========================
  // PRODUCTS
  // =========================

  http.get(
    "http://localhost:5000/api/products",
    ({ request }) => {
      const url = new URL(request.url);

      const search = url.searchParams
        .get("search")
        ?.toLowerCase();

      const category =
        url.searchParams.get("category");

      let filteredProducts = [...products];

      if (search) {
        filteredProducts = filteredProducts.filter(
          (product) =>
            product.name
              .toLowerCase()
              .includes(search)
        );
      }

      if (category) {
        filteredProducts = filteredProducts.filter(
          (product) =>
            String(product.category?.id) ===
              String(category) ||
            product.category?.name?.toLowerCase() ===
              category.toLowerCase()
        );
      }

      return HttpResponse.json({
        success: true,
        data: {
          products: filteredProducts,
          pagination: {
            page: 1,
            limit: filteredProducts.length,
            total: filteredProducts.length,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        },
      });
    }
  ),

  http.get(
    "http://localhost:5000/api/products/:id",
    ({ params }) => {
      const product = products.find(
        (item) =>
          String(item.id) === String(params.id)
      );

      if (!product) {
        return HttpResponse.json(
          {
            success: false,
            message: "Product not found",
          },
          {
            status: 404,
          }
        );
      }

      return HttpResponse.json({
        success: true,
        data: {
          product,
        },
      });
    }
  ),

  // =========================
  // AUTH
  // =========================

  http.post(
    "http://localhost:5000/api/auth/login",
    async ({ request }) => {
      const body = await request.json();

      if (
        body.email === "wrong@example.com" ||
        body.password === "wrongpassword"
      ) {
        return HttpResponse.json(
          {
            success: false,
            message: "Invalid email or password",
          },
          {
            status: 401,
          }
        );
      }

      if (
        !body.email ||
        !body.password
      ) {
        return HttpResponse.json(
          {
            success: false,
            message: "Email and password are required",
          },
          {
            status: 400,
          }
        );
      }

      const isAdmin =
        body.email === "admin@example.com";

      const user = isAdmin
        ? users.admin
        : {
            ...users.customer,
            email: body.email,
          };

      const token = isAdmin
        ? tokens.admin
        : tokens.customer;

      return HttpResponse.json({
        success: true,
        token,
        data: {
          token,
          user,
        },
        user,
      });
    }
  ),

  http.post(
    "http://localhost:5000/api/auth/register",
    async ({ request }) => {
      const body = await request.json();

      if (
        !body.name ||
        !body.email ||
        !body.password
      ) {
        return HttpResponse.json(
          {
            success: false,
            message: "Name, email and password are required",
          },
          {
            status: 400,
          }
        );
      }

      const user = {
        id: 99,
        name: body.name,
        email: body.email,
        role: "CUSTOMER",
      };

      return HttpResponse.json({
        success: true,
        token: tokens.customer,
        data: {
          token: tokens.customer,
          user,
        },
        user,
      });
    }
  ),

  http.get(
    "http://localhost:5000/api/auth/me",
    ({ request }) => {
      const user = getUserFromRequest({ request });

      if (!user) {
        return HttpResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      return HttpResponse.json({
        success: true,
        data: {
          user,
        },
        user,
      });
    }
  ),

  // =========================
  // CART
  // =========================

  http.get(
    "http://localhost:5000/api/cart",
    ({ request }) => {
      const user = getUserFromRequest({ request });

      if (!user) {
        return HttpResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      return HttpResponse.json({
        success: true,
        data: {
          cart,
        },
        cart,
      });
    }
  ),

  http.post(
    "http://localhost:5000/api/cart/items",
    async ({ request }) => {
      const user = getUserFromRequest({ request });

      if (!user) {
        return HttpResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      const body = await request.json();

      const product = products.find(
        (item) =>
          String(item.id) ===
          String(body.productId)
      );

      if (!product) {
        return HttpResponse.json(
          {
            success: false,
            message: "Product not found",
          },
          {
            status: 404,
          }
        );
      }

      const quantity = Number(body.quantity || 1);

      const existingItem = cart.items.find(
        (item) =>
          String(item.productId) ===
          String(body.productId)
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          id: Date.now(),
          productId: product.id,
          quantity,
          product,
        });
      }

      return HttpResponse.json({
        success: true,
        data: {
          cart,
        },
        cart,
      });
    }
  ),

  http.patch(
    "http://localhost:5000/api/cart/items/:productId",
    async ({ request, params }) => {
      const user = getUserFromRequest({ request });

      if (!user) {
        return HttpResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      const body = await request.json();

      const item = cart.items.find(
        (cartItem) =>
          String(cartItem.productId) ===
          String(params.productId)
      );

      if (!item) {
        return HttpResponse.json(
          {
            success: false,
            message: "Cart item not found",
          },
          {
            status: 404,
          }
        );
      }

      const quantity = Number(body.quantity);

      if (!Number.isFinite(quantity) || quantity < 1) {
        return HttpResponse.json(
          {
            success: false,
            message: "Quantity must be at least 1",
          },
          {
            status: 400,
          }
        );
      }

      item.quantity = quantity;

      return HttpResponse.json({
        success: true,
        data: {
          cart,
        },
        cart,
      });
    }
  ),

  http.delete(
    "http://localhost:5000/api/cart/items/:productId",
    ({ request, params }) => {
      const user = getUserFromRequest({ request });

      if (!user) {
        return HttpResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      cart.items = cart.items.filter(
        (item) =>
          String(item.productId) !==
          String(params.productId)
      );

      return HttpResponse.json({
        success: true,
        data: {
          cart,
        },
        cart,
      });
    }
  ),

  http.delete(
    "http://localhost:5000/api/cart",
    ({ request }) => {
      const user = getUserFromRequest({ request });

      if (!user) {
        return HttpResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          {
            status: 401,
          }
        );
      }

      cart.items = [];

      return HttpResponse.json({
        success: true,
        data: {
          cart,
        },
        cart,
      });
    }
  ),
];