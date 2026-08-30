import mongoose from "mongoose";
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

const isTestEnvironment = () =>
  process.env.NODE_ENV === "test" ||
  process.env.JEST_WORKER_ID !== undefined;

/**
 * MongoDB connection states:
 *
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 *
 * In tests, don't start a MongoDB operation when there is no
 * established connection. Otherwise Mongoose may buffer the
 * operation and keep Jest alive until the buffering timeout.
 */
const isMongoConnected = () =>
  mongoose.connection.readyState === 1;

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

  if (method === "PUT" || method === "PATCH") {
    return "UPDATE";
  }

  if (method === "DELETE") return "DELETE";

  return method;
};

/**
 * Wait until all activity-log operations that were started by
 * the middleware have finished.
 *
 * This is used by Jest teardown so MongoDB operations don't
 * continue after the test process has already finished.
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
    /*
     * No authenticated user means there is no activity to record.
     * Don't attempt to create an activity log for failed requests.
     */
    if (!req.user?.userId || res.statusCode >= 500) {
      return;
    }

    /*
     * During Jest runs, MongoDB may intentionally not be running.
     *
     * Do NOT call createActivityLog when MongoDB isn't connected.
     * Otherwise Mongoose buffers the insert for 10 seconds and Jest
     * reports:
     *
     * "Cannot log after tests are done"
     *
     * Production behavior is unchanged: when NODE_ENV is not test,
     * activity logging continues normally.
     */
    if (
      isTestEnvironment() &&
      !isMongoConnected()
    ) {
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
    }).catch((error) => {
      /*
       * Activity logging must never break the API request.
       * Log the error only while Jest is still active.
       */
      if (!isTestEnvironment()) {
        console.error(
          "Activity log error:",
          error.message
        );
      }
    });

    pendingActivityLogs.add(activityLogPromise);

    activityLogPromise.finally(() => {
      pendingActivityLogs.delete(activityLogPromise);
    });
  });

  next();
};

export default activityLogger;