import { Router } from "express";
import {
  registerCustomer,
  loginCustomer,
  getCustomerById,
  updateCustomer,
  listCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
} from "../controllers/customer.controller";

const customerRouter = Router();

customerRouter.post("/auth/register", registerCustomer);
customerRouter.post("/auth/login", loginCustomer);

customerRouter.get("/:id", getCustomerById);
customerRouter.patch("/:id", updateCustomer);

customerRouter.get("/:id/addresses", listCustomerAddresses);
customerRouter.post("/:id/addresses", createCustomerAddress);
customerRouter.patch("/:id/addresses/:addressId", updateCustomerAddress);
customerRouter.delete("/:id/addresses/:addressId", deleteCustomerAddress);

export default customerRouter;
