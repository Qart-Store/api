import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import {
  clearMyCart,
  getMyCart,
  getMyCartSummary,
  removeMyCartItem,
  upsertMyCartItem,
} from "../controllers/cart.controller";

const cartRouter = Router();

cartRouter.use(authMiddleware);

cartRouter.get("/", getMyCart);
cartRouter.post("/items", upsertMyCartItem);
cartRouter.delete("/items/:productId", removeMyCartItem);
cartRouter.delete("/", clearMyCart);
cartRouter.post("/summary", getMyCartSummary);

export default cartRouter;
