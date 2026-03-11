import { Router } from "express";
import {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  updateCurrentCustomer,
  listCurrentCustomerAddresses,
  createCurrentCustomerAddress,
  updateCurrentCustomerAddress,
  deleteCurrentCustomerAddress,
  getCustomerById,
  updateCustomer,
  listCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
} from "../controllers/customer.controller";
import authMiddleware from "../middlewares/auth.middleware";

const customerRouter = Router();

customerRouter.post("/auth/register", registerCustomer);
customerRouter.post("/auth/login", loginCustomer);

customerRouter.get("/auth/me", authMiddleware, getCurrentCustomer);
customerRouter.patch("/auth/me", authMiddleware, updateCurrentCustomer);
customerRouter.get(
  "/auth/me/addresses",
  authMiddleware,
  listCurrentCustomerAddresses,
);
customerRouter.post(
  "/auth/me/addresses",
  authMiddleware,
  createCurrentCustomerAddress,
);
customerRouter.patch(
  "/auth/me/addresses/:addressId",
  authMiddleware,
  updateCurrentCustomerAddress,
);
customerRouter.delete(
  "/auth/me/addresses/:addressId",
  authMiddleware,
  deleteCurrentCustomerAddress,
);

customerRouter.get("/:id", getCustomerById);
customerRouter.patch("/:id", updateCustomer);

customerRouter.get("/:id/addresses", listCustomerAddresses);
customerRouter.post("/:id/addresses", createCustomerAddress);
customerRouter.patch("/:id/addresses/:addressId", updateCustomerAddress);
customerRouter.delete("/:id/addresses/:addressId", deleteCustomerAddress);

export default customerRouter;
