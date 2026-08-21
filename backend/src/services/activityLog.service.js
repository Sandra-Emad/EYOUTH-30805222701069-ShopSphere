import mongoose from "mongoose";
import ActivityLog from "../models/activityLog.model.js";

/* ============================================================
   Helpers
============================================================ */

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/* ============================================================
   Create Activity Log
============================================================ */

export const createActivityLog = async ({
  userId = null,
  action,
  entity,
  entityId = null,
  details = null,
  metadata = null,
  method = null,
  endpoint = null,
  ipAddress = null,
  userAgent = null,
} = {}) => {
  if (!action) {
    throw createError(
      "Activity log action is required",
      400
    );
  }

  if (!entity) {
    throw createError(
      "Activity log entity is required",
      400
    );
  }

  const log = await ActivityLog.create({
    userId,
    action,
    entity,
    entityId,
    details,
    metadata,
    method,
    endpoint,
    ipAddress,
    userAgent,
  });

  return log;
};

/* ============================================================
   Get All Activity Logs
============================================================ */

export const getActivityLogs = async ({
  page = 1,
  limit = 20,
  userId,
  action,
  entity,
} = {}) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  /* -----------------------------
     Validate page
  ----------------------------- */

  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1
  ) {
    throw createError("Invalid page", 400);
  }

  /* -----------------------------
     Validate limit
  ----------------------------- */

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 100
  ) {
    throw createError("Invalid limit", 400);
  }

  /* -----------------------------
     Validate userId
  ----------------------------- */

  if (
    userId !== undefined &&
    userId !== null &&
    userId !== ""
  ) {
    const parsedUserId = Number(userId);

    if (
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0
    ) {
      throw createError("Invalid userId", 400);
    }

    userId = parsedUserId;
  }

  /* -----------------------------
     Build MongoDB filter
  ----------------------------- */

  const filter = {};

  if (
    userId !== undefined &&
    userId !== null &&
    userId !== ""
  ) {
    filter.userId = userId;
  }

  if (
    typeof action === "string" &&
    action.trim()
  ) {
    filter.action = action.trim();
  }

  if (
    typeof entity === "string" &&
    entity.trim()
  ) {
    filter.entity = entity.trim();
  }

  /* -----------------------------
     Pagination
  ----------------------------- */

  const skip =
    (parsedPage - 1) * parsedLimit;

  /* -----------------------------
     Database queries
  ----------------------------- */

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),

    ActivityLog.countDocuments(filter),
  ]);

  const pages =
    total === 0
      ? 0
      : Math.ceil(total / parsedLimit);

  /* -----------------------------
     Return result
  ----------------------------- */

  return {
    logs,

    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages,

      totalPages: pages,

      hasNextPage:
        parsedPage < pages,

      hasPreviousPage:
        parsedPage > 1,
    },
  };
};

/* ============================================================
   Get Activity Log By ID
============================================================ */

export const getActivityLogById = async (id) => {
  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    throw createError(
      "Invalid activity log ID",
      400
    );
  }

  const log =
    await ActivityLog.findById(id).lean();

  if (!log) {
    throw createError(
      "Activity log not found",
      404
    );
  }

  return log;
};

/* ============================================================
   Delete Activity Log
============================================================ */

export const deleteActivityLog = async (id) => {
  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    throw createError(
      "Invalid activity log ID",
      400
    );
  }

  const log =
    await ActivityLog.findByIdAndDelete(id);

  if (!log) {
    throw createError(
      "Activity log not found",
      404
    );
  }

  return log;
};

/* ============================================================
   Default Export
============================================================ */

export default {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  deleteActivityLog,
};