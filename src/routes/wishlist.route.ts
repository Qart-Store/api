import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import validateRequest from "../middlewares/validate-request.middleware";
import {
  addMyWishlistItem,
  listMyWishlist,
  removeMyWishlistItem,
} from "../controllers/wishlist.controller";
import {
  cartItemParamsSchema,
  wishlistItemBodySchema,
} from "../validators/commerce.validation";

const wishlistRouter = Router();

wishlistRouter.use(authMiddleware);

wishlistRouter.get("/", listMyWishlist);
wishlistRouter.post(
  "/items",
  validateRequest({ body: wishlistItemBodySchema }),
  addMyWishlistItem,
);
wishlistRouter.delete(
  "/items/:productId",
  validateRequest({ params: cartItemParamsSchema }),
  removeMyWishlistItem,
);

export default wishlistRouter;
