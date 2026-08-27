import { createActivityLog } from "../services/activityLog.service.js";

const MUTATING_METHODS = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

/**
 * Keep track of activity-log promises that are still running.
 *
 * This is especially important for Jest because the response `finish`
 * event can fire while the MongoDB insert is still pending.
 */
const pendingActivityLogs = new Set();

const getEntity = (path = "") => {
  const value = path
    .replace(/^\/api\/?/, "")
    .split("/")[0];

  const entities = {
    auth: "User",
    products: "Product",
    categories: "Category",
    cart: "Cart",
    orders: "Order",
    reviews: "Review",
    "product-images": "ProductImage",
  };

  return entities[value] || value || "API";
};

const getAction = (method) => {
  if (method === "POST") return "CREATE";
  if (method === "PUT" || method === "PATCH") return "UPDATE";
  if (method === "DELETE") return "DELETE";

  return method;
};

/**
 * Wait until all activity-log operations that were started by the
 * middleware have finished.
 *
 * This is used by Jest teardown so MongoDB operations don't continue
 * after the test process has already finished.
 */
export const waitForActivityLogs = async () => {
  while (pendingActivityLogs.size > 0) {
    await Promise.allSettled([
      ...pendingActivityLogs,
    ]);
  }
};

const activityLogger = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  res.on("finish", () => {
    if (!req.user?.userId || res.statusCode >= 500) {
      return;
    }

    const activityLogPromise = createActivityLog({
      userId: Number(req.user.userId),
      action: getAction(req.method),
      entity: getEntity(req.originalUrl),
      entityId:
        req.params?.id ||
        req.params?.productId ||
        req.params?.reviewId ||
        null,
      details: {
        statusCode: res.statusCode,
      },
      method: req.method,
      endpoint: req.originalUrl,
      ipAddress: req.ip || null,
      userAgent: req.get("user-agent") || null,
    })
      .catch((error) => {
        console.error(
          "Activity log error:",
          error.message
        );
      });

    pendingActivityLogs.add(activityLogPromise);

    activityLogPromise.finally(() => {
      pendingActivityLogs.delete(activityLogPromise);
    });
  });

  next();
};

export default activityLogger;
