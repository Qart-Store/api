import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import validateRequest from "../middlewares/validate-request.middleware";
import {
  clearMyCart,
  getMyCart,
  getMyCartSummary,
  removeMyCartItem,
  upsertMyCartItem,
} from "../controllers/cart.controller";
import {
  cartItemBodySchema,
  cartItemParamsSchema,
  cartSummaryBodySchema,
} from "../validators/commerce.validation";

const cartRouter = Router();

cartRouter.use(authMiddleware);

cartRouter.get("/", getMyCart);
cartRouter.post(
  "/items",
  validateRequest({ body: cartItemBodySchema }),
  upsertMyCartItem,
);
cartRouter.delete(
  "/items/:productId",
  validateRequest({ params: cartItemParamsSchema }),
  removeMyCartItem,
);
cartRouter.delete("/", clearMyCart);
cartRouter.post(
  "/summary",
  validateRequest({ body: cartSummaryBodySchema }),
  getMyCartSummary,
);

export default cartRouter;
