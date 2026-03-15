import { Router } from "express";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { productUploadMiddleware } from "../middlewares/upload.middleware";

const productRouter = Router();

productRouter.get("/", listProducts);
productRouter.get("/:id", getProductById);
productRouter.post("/", productUploadMiddleware, createProduct);
productRouter.patch("/:id", productUploadMiddleware, updateProduct);
productRouter.delete("/:id", deleteProduct);

export default productRouter;
