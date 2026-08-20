import express from "express";

import {
  create,
  getMine,
  getOne,
  getAll,
  updateStatus,
  cancel,
  deleteOrder,
} from "../controllers/order.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import validationMiddleware from "../middlewares/validation.middleware.js";

import {
  orderIdParamsSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} from "../validators/order.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Create Order
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authMiddleware,
  create
);

/*
|--------------------------------------------------------------------------
| Get My Orders
|--------------------------------------------------------------------------
*/

router.get(
  "/my-orders",
  authMiddleware,
  getMine
);

/*
|--------------------------------------------------------------------------
| Admin - Get All Orders
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validationMiddleware(
    orderQuerySchema,
    "query"
  ),
  getAll
);

/*
|--------------------------------------------------------------------------
| Admin - Update Order Status
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validationMiddleware(
    orderIdParamsSchema,
    "params"
  ),
  validationMiddleware(
    updateOrderStatusSchema
  ),
  updateStatus
);

/*
|--------------------------------------------------------------------------
| Customer - Cancel Order
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/cancel",
  authMiddleware,
  validationMiddleware(
    orderIdParamsSchema,
    "params"
  ),
  cancel
);

/*
|--------------------------------------------------------------------------
| Admin - Delete Order
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validationMiddleware(
    orderIdParamsSchema,
    "params"
  ),
  deleteOrder
);

/*
|--------------------------------------------------------------------------
| Get Order By ID
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  authMiddleware,
  validationMiddleware(
    orderIdParamsSchema,
    "params"
  ),
  getOne
);

export default router;