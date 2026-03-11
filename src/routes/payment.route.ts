import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import {
  initializeMyPayment,
  paymentWebhook,
  verifyMyPayment,
} from "../controllers/payment.controller";

const paymentRouter = Router();

paymentRouter.post("/webhook", paymentWebhook);
paymentRouter.post("/initialize", authMiddleware, initializeMyPayment);
paymentRouter.get("/verify/:reference", authMiddleware, verifyMyPayment);

export default paymentRouter;
