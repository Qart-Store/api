import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import {
  addMyWishlistItem,
  listMyWishlist,
  removeMyWishlistItem,
} from "../controllers/wishlist.controller";

const wishlistRouter = Router();

wishlistRouter.use(authMiddleware);

wishlistRouter.get("/", listMyWishlist);
wishlistRouter.post("/items", addMyWishlistItem);
wishlistRouter.delete("/items/:productId", removeMyWishlistItem);

export default wishlistRouter;
