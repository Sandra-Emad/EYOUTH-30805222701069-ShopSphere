import express from "express";

import {
  register,
  login,
  getMe,
  updateMe,
} from "../controllers/auth.controller.js";

import validate from "../middlewares/validate.middleware.js";

import authenticate from "../middlewares/auth.middleware.js";

import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

// Public
router.post(
  "/register",
  validate(registerSchema),
  register
);

// Public
router.post(
  "/login",
  validate(loginSchema),
  login
);

// Protected
router.get(
  "/me",
  authenticate,
  getMe
);

// Protected
router.put(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  updateMe
);

export default router;