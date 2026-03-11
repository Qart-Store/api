import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import {
  createMyOrder,
  getMyOrder,
  listMyOrders,
} from "../controllers/order.controller";

const orderRouter = Router();

orderRouter.use(authMiddleware);

orderRouter.post("/", createMyOrder);
orderRouter.get("/", listMyOrders);
orderRouter.get("/:orderId", getMyOrder);

export default orderRouter;
