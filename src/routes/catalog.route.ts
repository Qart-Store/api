import { Router } from "express";
import { getCategories, getBrands } from "../controllers/catalog.controller";

const catalogRouter = Router();

catalogRouter.get("/categories", getCategories);
catalogRouter.get("/brands", getBrands);

export default catalogRouter;
