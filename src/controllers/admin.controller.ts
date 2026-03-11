import { Request, Response } from "express";
import * as adminModel from "../models/admin.model";
import * as customerModel from "../models/customer.model";
import * as productModel from "../models/product.model";
import asyncHandler from "../utils/async-handler";
import AppError from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";

function toSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBoolean(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
}

export const getDashboardSummary = asyncHandler(
  async (_req: Request, res: Response) => {
    const summary = await adminModel.getAdminDashboardSummary();
    return sendSuccess(
      res,
      "Admin dashboard summary fetched",
      summary,
      200,
      "ok",
    );
  },
);

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminModel.listCustomersAdmin({
    page: toNumber(req.query.page),
    limit: toNumber(req.query.limit),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    isActive: toBoolean(req.query.isActive),
    isEmailVerified: toBoolean(req.query.isEmailVerified),
  });

  return sendSuccess(res, "Customers fetched", result, 200, "ok");
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customerId = toSingleParam(req.params.customerId);
  const customer = await adminModel.getCustomerAdmin(customerId);

  if (!customer) {
    throw new AppError("Customer not found", 404, "error");
  }

  return sendSuccess(res, "Customer fetched", customer, 200, "ok");
});

export const updateCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);
    const body = req.body as UpdateCustomerInput;

    const updated = await customerModel.updateCustomer(customerId, body);
    if (!updated) {
      throw new AppError("Customer not found", 404, "error");
    }

    return sendSuccess(res, "Customer updated", updated, 200, "success");
  },
);

export const deleteCustomer = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);
    const deleted = await adminModel.deleteCustomerAdmin(customerId);

    if (!deleted) {
      throw new AppError("Customer not found", 404, "error");
    }

    return sendSuccess(
      res,
      "Customer deleted",
      { id: customerId },
      200,
      "success",
    );
  },
);

export const listCustomerAddresses = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);

    const customer = await adminModel.getCustomerAdmin(customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    const addresses = await customerModel.listCustomerAddresses(customerId);
    return sendSuccess(res, "Customer addresses fetched", addresses, 200, "ok");
  },
);

export const createCustomerAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);
    const body = req.body as CreateCustomerAddressInput;

    const customer = await adminModel.getCustomerAdmin(customerId);
    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    const address = await customerModel.createCustomerAddress(customerId, body);
    return sendSuccess(res, "Customer address created", address, 201, "success");
  },
);

export const updateCustomerAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);
    const addressId = toSingleParam(req.params.addressId);
    const body = req.body as UpdateCustomerAddressInput;

    const address = await customerModel.updateCustomerAddress(
      customerId,
      addressId,
      body,
    );

    if (!address) {
      throw new AppError("Address not found", 404, "error");
    }

    return sendSuccess(res, "Customer address updated", address, 200, "success");
  },
);

export const deleteCustomerAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);
    const addressId = toSingleParam(req.params.addressId);

    const deleted = await customerModel.deleteCustomerAddress(customerId, addressId);
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

export const getCustomerCart = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);
    const customer = await adminModel.getCustomerAdmin(customerId);

    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    const items = await adminModel.listCustomerCartAdmin(customerId);
    return sendSuccess(res, "Customer cart fetched", items, 200, "ok");
  },
);

export const clearCustomerCart = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);
    const customer = await adminModel.getCustomerAdmin(customerId);

    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    await adminModel.clearCustomerCartAdmin(customerId);
    return sendSuccess(res, "Customer cart cleared", { customerId }, 200, "success");
  },
);

export const getCustomerWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);
    const customer = await adminModel.getCustomerAdmin(customerId);

    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    const items = await adminModel.listCustomerWishlistAdmin(customerId);
    return sendSuccess(res, "Customer wishlist fetched", items, 200, "ok");
  },
);

export const clearCustomerWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const customerId = toSingleParam(req.params.customerId);
    const customer = await adminModel.getCustomerAdmin(customerId);

    if (!customer) {
      throw new AppError("Customer not found", 404, "error");
    }

    await adminModel.clearCustomerWishlistAdmin(customerId);
    return sendSuccess(
      res,
      "Customer wishlist cleared",
      { customerId },
      200,
      "success",
    );
  },
);

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const filters: ProductListFilters = {
    page: toNumber(req.query.page),
    limit: toNumber(req.query.limit),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    category:
      typeof req.query.category === "string" ? req.query.category : undefined,
    brand: typeof req.query.brand === "string" ? req.query.brand : undefined,
    status:
      typeof req.query.status === "string"
        ? (req.query.status as ProductStatus)
        : undefined,
    minPrice: toNumber(req.query.minPrice),
    maxPrice: toNumber(req.query.maxPrice),
    sortBy:
      typeof req.query.sortBy === "string"
        ? (req.query.sortBy as ProductListFilters["sortBy"])
        : undefined,
    sortOrder:
      typeof req.query.sortOrder === "string"
        ? (req.query.sortOrder as ProductListFilters["sortOrder"])
        : undefined,
  };

  const result = await productModel.listProducts(filters);
  return sendSuccess(res, "Products fetched", result, 200, "ok");
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = toSingleParam(req.params.productId);
  const product = await productModel.getProductById(productId);

  if (!product) {
    throw new AppError("Product not found", 404, "error");
  }

  return sendSuccess(res, "Product fetched", product, 200, "ok");
});

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CreateProductInput;
    const product = await productModel.createProduct(body);
    return sendSuccess(res, "Product created", product, 201, "success");
  },
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = toSingleParam(req.params.productId);
    const body = req.body as UpdateProductInput;

    const updated = await productModel.updateProduct(productId, body);
    if (!updated) {
      throw new AppError("Product not found", 404, "error");
    }

    return sendSuccess(res, "Product updated", updated, 200, "success");
  },
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = toSingleParam(req.params.productId);
    const deleted = await productModel.deleteProduct(productId);

    if (!deleted) {
      throw new AppError("Product not found", 404, "error");
    }

    return sendSuccess(res, "Product deleted", { id: productId }, 200, "success");
  },
);

export const listCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await adminModel.listCategoriesAdmin();
    return sendSuccess(res, "Categories fetched", categories, 200, "ok");
  },
);

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = toSingleParam(req.params.categoryId);
  const category = await adminModel.getCategoryAdmin(categoryId);

  if (!category) {
    throw new AppError("Category not found", 404, "error");
  }

  return sendSuccess(res, "Category fetched", category, 200, "ok");
});

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as {
      name: string;
      slug?: string;
      description?: string | null;
    };

    const category = await adminModel.createCategoryAdmin(body);
    return sendSuccess(res, "Category created", category, 201, "success");
  },
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = toSingleParam(req.params.categoryId);
    const body = req.body as {
      name?: string;
      slug?: string;
      description?: string | null;
    };

    const updated = await adminModel.updateCategoryAdmin(categoryId, body);
    if (!updated) {
      throw new AppError("Category not found", 404, "error");
    }

    return sendSuccess(res, "Category updated", updated, 200, "success");
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = toSingleParam(req.params.categoryId);
    const deleted = await adminModel.deleteCategoryAdmin(categoryId);

    if (!deleted) {
      throw new AppError("Category not found", 404, "error");
    }

    return sendSuccess(res, "Category deleted", { id: categoryId }, 200, "success");
  },
);

export const listBrands = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await adminModel.listBrandsAdmin();
  return sendSuccess(res, "Brands fetched", brands, 200, "ok");
});

export const getBrand = asyncHandler(async (req: Request, res: Response) => {
  const brandId = toSingleParam(req.params.brandId);
  const brand = await adminModel.getBrandAdmin(brandId);

  if (!brand) {
    throw new AppError("Brand not found", 404, "error");
  }

  return sendSuccess(res, "Brand fetched", brand, 200, "ok");
});

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { name: string; slug?: string };
  const brand = await adminModel.createBrandAdmin(body);
  return sendSuccess(res, "Brand created", brand, 201, "success");
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const brandId = toSingleParam(req.params.brandId);
  const body = req.body as { name?: string; slug?: string };
  const updated = await adminModel.updateBrandAdmin(brandId, body);

  if (!updated) {
    throw new AppError("Brand not found", 404, "error");
  }

  return sendSuccess(res, "Brand updated", updated, 200, "success");
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  const brandId = toSingleParam(req.params.brandId);
  const deleted = await adminModel.deleteBrandAdmin(brandId);

  if (!deleted) {
    throw new AppError("Brand not found", 404, "error");
  }

  return sendSuccess(res, "Brand deleted", { id: brandId }, 200, "success");
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminModel.listOrdersAdmin({
    page: toNumber(req.query.page),
    limit: toNumber(req.query.limit),
    status:
      typeof req.query.status === "string"
        ? (req.query.status as OrderEntity["status"])
        : undefined,
    customerId:
      typeof req.query.customerId === "string"
        ? req.query.customerId
        : undefined,
  });

  return sendSuccess(res, "Orders fetched", result, 200, "ok");
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const orderId = toSingleParam(req.params.orderId);
  const order = await adminModel.getOrderAdmin(orderId);

  if (!order) {
    throw new AppError("Order not found", 404, "error");
  }

  return sendSuccess(res, "Order fetched", order, 200, "ok");
});

export const getOrderItems = asyncHandler(
  async (req: Request, res: Response) => {
    const orderId = toSingleParam(req.params.orderId);
    const order = await adminModel.getOrderAdmin(orderId);

    if (!order) {
      throw new AppError("Order not found", 404, "error");
    }

    const items = await adminModel.listOrderItemsAdmin(orderId);
    return sendSuccess(res, "Order items fetched", items, 200, "ok");
  },
);

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const orderId = toSingleParam(req.params.orderId);
    const body = req.body as { status: OrderEntity["status"] };

    const updated = await adminModel.updateOrderStatusAdmin(orderId, body.status);
    if (!updated) {
      throw new AppError("Order not found", 404, "error");
    }

    return sendSuccess(res, "Order status updated", updated, 200, "success");
  },
);

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const orderId = toSingleParam(req.params.orderId);
  const deleted = await adminModel.deleteOrderAdmin(orderId);

  if (!deleted) {
    throw new AppError("Order not found", 404, "error");
  }

  return sendSuccess(res, "Order deleted", { id: orderId }, 200, "success");
});

export const listPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await adminModel.listPaymentsAdmin({
      page: toNumber(req.query.page),
      limit: toNumber(req.query.limit),
      status:
        typeof req.query.status === "string"
          ? (req.query.status as PaymentTransactionEntity["status"])
          : undefined,
      customerId:
        typeof req.query.customerId === "string"
          ? req.query.customerId
          : undefined,
      orderId: typeof req.query.orderId === "string" ? req.query.orderId : undefined,
    });

    return sendSuccess(res, "Payments fetched", result, 200, "ok");
  },
);

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const reference = toSingleParam(req.params.reference);
  const payment = await adminModel.getPaymentByReferenceAdmin(reference);

  if (!payment) {
    throw new AppError("Payment not found", 404, "error");
  }

  return sendSuccess(res, "Payment fetched", payment, 200, "ok");
});

export const updatePaymentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const reference = toSingleParam(req.params.reference);
    const body = req.body as {
      status: PaymentTransactionEntity["status"];
      payload?: Record<string, unknown>;
    };

    const updated = await adminModel.updatePaymentStatusAdmin(
      reference,
      body.status,
      body.payload,
    );

    if (!updated) {
      throw new AppError("Payment not found", 404, "error");
    }

    return sendSuccess(res, "Payment status updated", updated, 200, "success");
  },
);

export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
  const reference = toSingleParam(req.params.reference);
  const deleted = await adminModel.deletePaymentByReferenceAdmin(reference);

  if (!deleted) {
    throw new AppError("Payment not found", 404, "error");
  }

  return sendSuccess(
    res,
    "Payment deleted",
    { reference },
    200,
    "success",
  );
});

export const listCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await adminModel.listCouponsAdmin();
  return sendSuccess(res, "Coupons fetched", coupons, 200, "ok");
});

export const getCoupon = asyncHandler(async (req: Request, res: Response) => {
  const couponId = toSingleParam(req.params.couponId);
  const coupon = await adminModel.getCouponAdmin(couponId);

  if (!coupon) {
    throw new AppError("Coupon not found", 404, "error");
  }

  return sendSuccess(res, "Coupon fetched", coupon, 200, "ok");
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as {
    code: string;
    discountPercent: number;
    isActive?: boolean;
    expiresAt?: string | null;
  };

  const coupon = await adminModel.createCouponAdmin(body);
  return sendSuccess(res, "Coupon created", coupon, 201, "success");
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const couponId = toSingleParam(req.params.couponId);
  const body = req.body as {
    code?: string;
    discountPercent?: number;
    isActive?: boolean;
    expiresAt?: string | null;
  };

  const updated = await adminModel.updateCouponAdmin(couponId, body);
  if (!updated) {
    throw new AppError("Coupon not found", 404, "error");
  }

  return sendSuccess(res, "Coupon updated", updated, 200, "success");
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const couponId = toSingleParam(req.params.couponId);
  const deleted = await adminModel.deleteCouponAdmin(couponId);

  if (!deleted) {
    throw new AppError("Coupon not found", 404, "error");
  }

  return sendSuccess(res, "Coupon deleted", { id: couponId }, 200, "success");
});
