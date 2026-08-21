import express from "express";

import {
  getLogs,
  getLogById,
} from "../controllers/activityLog.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  roleMiddleware("ADMIN"),
  getLogs
);

router.get(
  "/:id",
  authenticate,
  roleMiddleware("ADMIN"),
  getLogById
);

export default router;