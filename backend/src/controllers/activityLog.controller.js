import {
  getActivityLogs,
  getActivityLogById,
} from "../services/activityLog.service.js";

/* ============================================================
   GET /api/activity-logs
============================================================ */

export const getLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      entity,
    } = req.query;

    const result = await getActivityLogs({
      page: Number(page),
      limit: Number(limit),
      userId,
      action,
      entity,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

/* ============================================================
   GET /api/activity-logs/:id
============================================================ */

export const getLogById = async (req, res, next) => {
  try {
    const log = await getActivityLogById(req.params.id);

    return res.status(200).json({
      success: true,
      log,
    });
  } catch (error) {
    return next(error);
  }
};