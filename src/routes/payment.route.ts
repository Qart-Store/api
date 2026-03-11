import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import validateRequest from "../middlewares/validate-request.middleware";
import {
  initializeMyPayment,
  paymentWebhook,
  verifyMyPayment,
} from "../controllers/payment.controller";
import {
  paymentInitializeBodySchema,
  paymentVerifyParamsSchema,
  paymentWebhookBodySchema,
} from "../validators/commerce.validation";

const paymentRouter = Router();

paymentRouter.post(
  "/webhook",
  validateRequest({ body: paymentWebhookBodySchema }),
  paymentWebhook,
);
paymentRouter.post(
  "/initialize",
  authMiddleware,
  validateRequest({ body: paymentInitializeBodySchema }),
  initializeMyPayment,
);
paymentRouter.get(
  "/verify/:reference",
  authMiddleware,
  validateRequest({ params: paymentVerifyParamsSchema }),
  verifyMyPayment,
);

export default paymentRouter;
