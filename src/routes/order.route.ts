import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import validateRequest from "../middlewares/validate-request.middleware";
import {
  createMyOrder,
  getMyOrder,
  listMyOrders,
} from "../controllers/order.controller";
import {
  orderCreateBodySchema,
  orderIdParamsSchema,
} from "../validators/commerce.validation";

const orderRouter = Router();

orderRouter.use(authMiddleware);

orderRouter.post(
  "/",
  validateRequest({ body: orderCreateBodySchema }),
  createMyOrder,
);
orderRouter.get("/", listMyOrders);
orderRouter.get(
  "/:orderId",
  validateRequest({ params: orderIdParamsSchema }),
  getMyOrder,
);

export default orderRouter;
