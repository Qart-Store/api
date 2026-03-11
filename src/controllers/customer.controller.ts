import { Request, Response } from "express";
import bcrypt from "bcrypt";
import * as customerModel from "../models/customer.model";
import asyncHandler from "../utils/async-handler";
import AppError from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";
import { signAuthToken } from "../utils/token";

function toSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toSafeCustomer(customer: CustomerEntity) {
  return customer;
}

function requireAuthUser(req: Request) {
  if (!req.authUser?.id) {
    throw new AppError("Authentication required", 401, "failed");
  }

  return req.authUser;
}

export const registerCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CustomerRegisterPayload;

    if (
      !body?.firstName?.trim() ||
      !body?.lastName?.trim() ||
      !body?.email?.trim() ||
      !body?.password
    ) {
      throw new AppError(
        "firstName, lastName, email and password are required",
        400,
        "failed",
      );
    }

    if (body.password.length < 8) {
      throw new AppError(
        "Password must be at least 8 characters",
        400,
        "failed",
      );
    }

    const existing = await customerModel.findCustomerByEmailWithPassword(
      body.email,
    );
    if (existing) {
      throw new AppError(
        "An account with this email already exists",
        409,
        "failed",
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const customer = await customerModel.createCustomer({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      passwordHash,
      phone: body.phone ?? null,
    });

    const token = signAuthToken({ sub: customer.id, email: customer.email });

    return sendSuccess(
      res,
      "Customer registered successfully",
      { customer: toSafeCustomer(customer), token },
      201,
      "success",
    );
  },
);

export const loginCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CustomerLoginPayload;

    if (!body?.email?.trim() || !body?.password) {
      throw new AppError("email and password are required", 400, "failed");
    }

    const customer = await customerModel.findCustomerByEmailWithPassword(
      body.email,
    );
    if (!customer) {
      throw new AppError("Invalid email or password", 401, "failed");
    }

    const validPassword = await bcrypt.compare(
      body.password,
      customer.passwordHash,
    );
    if (!validPassword) {
      throw new AppError("Invalid email or password", 401, "failed");
    }

    await customerModel.touchCustomerLastLogin(customer.id);

    const sanitized: CustomerEntity = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      isActive: customer.isActive,
      isEmailVerified: customer.isEmailVerified,
      lastLoginAt: new Date().toISOString(),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };

    const token = signAuthToken({ sub: sanitized.id, email: sanitized.email });

    return sendSuccess(
      res,
      "Login successful",
      { customer: sanitized, token },
      200,
      "success",
    );
  },
);

export const getCurrentCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const customer = await customerModel.findCustomerById(authUser.id);

    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Customer profile fetched",
      toSafeCustomer(customer),
      200,
      "ok",
    );
  },
);

export const updateCurrentCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const body = req.body as UpdateCustomerInput;

    const updated = await customerModel.updateCustomer(authUser.id, body);

    if (!updated) {
      throw new AppError("Customer not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Customer profile updated",
      toSafeCustomer(updated),
      200,
      "success",
    );
  },
);

export const listCurrentCustomerAddresses = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const addresses = await customerModel.listCustomerAddresses(authUser.id);
    return sendSuccess(res, "Customer addresses fetched", addresses, 200, "ok");
  },
);

export const createCurrentCustomerAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const body = req.body as CreateCustomerAddressInput;

    if (
      !body?.recipientName?.trim() ||
      !body?.state?.trim() ||
      !body?.city?.trim() ||
      !body?.addressLine1?.trim()
    ) {
      throw new AppError(
        "recipientName, state, city and addressLine1 are required",
        400,
        "failed",
      );
    }

    const address = await customerModel.createCustomerAddress(
      authUser.id,
      body,
    );
    return sendSuccess(res, "Customer address added", address, 201, "success");
  },
);

export const updateCurrentCustomerAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const addressId = toSingleParam(req.params.addressId);
    const body = req.body as UpdateCustomerAddressInput;

    const address = await customerModel.updateCustomerAddress(
      authUser.id,
      addressId,
      body,
    );

    if (!address) {
      throw new AppError("Address not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Customer address updated",
      address,
      200,
      "success",
    );
  },
);

export const deleteCurrentCustomerAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const authUser = requireAuthUser(req);
    const addressId = toSingleParam(req.params.addressId);

    const deleted = await customerModel.deleteCustomerAddress(
      authUser.id,
      addressId,
    );
    if (!deleted) {
      throw new AppError("Address not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Customer address deleted",
      { id: addressId },
      200,
      "success",
    );
  },
);

export const getCustomerById = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.id);
    const customer = await customerModel.findCustomerById(customerId);

    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Customer profile fetched",
      toSafeCustomer(customer),
      200,
      "ok",
    );
  },
);

export const updateCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.id);
    const body = req.body as UpdateCustomerInput;

    const updated = await customerModel.updateCustomer(customerId, body);

    if (!updated) {
      throw new AppError("Customer not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Customer profile updated",
      toSafeCustomer(updated),
      200,
      "success",
    );
  },
);

export const listCustomerAddresses = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.id);

    const customer = await customerModel.findCustomerById(customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    const addresses = await customerModel.listCustomerAddresses(customerId);
    return sendSuccess(res, "Customer addresses fetched", addresses, 200, "ok");
  },
);

export const createCustomerAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.id);
    const body = req.body as CreateCustomerAddressInput;

    if (
      !body?.recipientName?.trim() ||
      !body?.state?.trim() ||
      !body?.city?.trim() ||
      !body?.addressLine1?.trim()
    ) {
      throw new AppError(
        "recipientName, state, city and addressLine1 are required",
        400,
        "failed",
      );
    }

    const customer = await customerModel.findCustomerById(customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    const address = await customerModel.createCustomerAddress(customerId, body);
    return sendSuccess(res, "Customer address added", address, 201, "success");
  },
);

export const updateCustomerAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.id);
    const addressId = toSingleParam(req.params.addressId);
    const body = req.body as UpdateCustomerAddressInput;

    const customer = await customerModel.findCustomerById(customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    const address = await customerModel.updateCustomerAddress(
      customerId,
      addressId,
      body,
    );
    if (!address) {
      throw new AppError("Address not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Customer address updated",
      address,
      200,
      "success",
    );
  },
);

export const deleteCustomerAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.id);
    const addressId = toSingleParam(req.params.addressId);

    const customer = await customerModel.findCustomerById(customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    const deleted = await customerModel.deleteCustomerAddress(
      customerId,
      addressId,
    );
    if (!deleted) {
      throw new AppError("Address not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Customer address deleted",
      { id: addressId },
      200,
      "success",
    );
  },
);
