import express from "express";

import {
  getStatistics,
} from "../controllers/statistics.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  roleMiddleware("ADMIN"),
  getStatistics
);

export default router;
