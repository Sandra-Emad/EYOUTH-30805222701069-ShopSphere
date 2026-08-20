import express from "express";

import {
  register,
  login,
  getMe,
  updateMe,
} from "../controllers/auth.controller.js";

import validationMiddleware from "../middlewares/validation.middleware.js";
import authenticate from "../middlewares/auth.middleware.js";

import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  validationMiddleware(registerSchema),
  register
);

router.post(
  "/login",
  validationMiddleware(loginSchema),
  login
);

/*
|--------------------------------------------------------------------------
| Protected
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  authenticate,
  getMe
);

router.put(
  "/me",
  authenticate,
  validationMiddleware(updateProfileSchema),
  updateMe
);

export default router;