import { Router } from "express";
import adminAuthMiddleware from "../middlewares/admin-auth.middleware";
import validateRequest from "../middlewares/validate-request.middleware";
import {
  getDashboardSummary,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  listCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerCart,
  clearCustomerCart,
  getCustomerWishlist,
  clearCustomerWishlist,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  listOrders,
  getOrder,
  getOrderItems,
  updateOrderStatus,
  deleteOrder,
  listPayments,
  getPayment,
  updatePaymentStatus,
  deletePayment,
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/admin.controller";
import {
  customerIdParamsSchema,
  addressIdParamsSchema,
  customersQuerySchema,
  updateCustomerBodySchema,
  createAddressBodySchema,
  updateAddressBodySchema,
  productIdParamsSchema,
  productsQuerySchema,
  createProductBodySchema,
  updateProductBodySchema,
  categoryIdParamsSchema,
  brandIdParamsSchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
  createBrandBodySchema,
  updateBrandBodySchema,
  orderIdParamsSchema,
  ordersQuerySchema,
  updateOrderStatusBodySchema,
  paymentReferenceParamsSchema,
  paymentsQuerySchema,
  updatePaymentStatusBodySchema,
  couponIdParamsSchema,
  createCouponBodySchema,
  updateCouponBodySchema,
} from "../validators/admin.validation";

const adminRouter = Router();

adminRouter.use(adminAuthMiddleware);

adminRouter.get("/dashboard/summary", getDashboardSummary);

adminRouter.get(
  "/customers",
  validateRequest({ query: customersQuerySchema }),
  listCustomers,
);
adminRouter.get(
  "/customers/:customerId",
  validateRequest({ params: customerIdParamsSchema }),
  getCustomer,
);
adminRouter.patch(
  "/customers/:customerId",
  validateRequest({
    params: customerIdParamsSchema,
    body: updateCustomerBodySchema,
  }),
  updateCustomer,
);
adminRouter.delete(
  "/customers/:customerId",
  validateRequest({ params: customerIdParamsSchema }),
  deleteCustomer,
);

adminRouter.get(
  "/customers/:customerId/addresses",
  validateRequest({ params: customerIdParamsSchema }),
  listCustomerAddresses,
);
adminRouter.post(
  "/customers/:customerId/addresses",
  validateRequest({
    params: customerIdParamsSchema,
    body: createAddressBodySchema,
  }),
  createCustomerAddress,
);
adminRouter.patch(
  "/customers/:customerId/addresses/:addressId",
  validateRequest({
    params: addressIdParamsSchema,
    body: updateAddressBodySchema,
  }),
  updateCustomerAddress,
);
adminRouter.delete(
  "/customers/:customerId/addresses/:addressId",
  validateRequest({ params: addressIdParamsSchema }),
  deleteCustomerAddress,
);

adminRouter.get(
  "/customers/:customerId/cart",
  validateRequest({ params: customerIdParamsSchema }),
  getCustomerCart,
);
adminRouter.delete(
  "/customers/:customerId/cart",
  validateRequest({ params: customerIdParamsSchema }),
  clearCustomerCart,
);

adminRouter.get(
  "/customers/:customerId/wishlist",
  validateRequest({ params: customerIdParamsSchema }),
  getCustomerWishlist,
);
adminRouter.delete(
  "/customers/:customerId/wishlist",
  validateRequest({ params: customerIdParamsSchema }),
  clearCustomerWishlist,
);

adminRouter.get(
  "/products",
  validateRequest({ query: productsQuerySchema }),
  listProducts,
);
adminRouter.post(
  "/products",
  validateRequest({ body: createProductBodySchema }),
  createProduct,
);
adminRouter.get(
  "/products/:productId",
  validateRequest({ params: productIdParamsSchema }),
  getProduct,
);
adminRouter.patch(
  "/products/:productId",
  validateRequest({
    params: productIdParamsSchema,
    body: updateProductBodySchema,
  }),
  updateProduct,
);
adminRouter.delete(
  "/products/:productId",
  validateRequest({ params: productIdParamsSchema }),
  deleteProduct,
);

adminRouter.get("/categories", listCategories);
adminRouter.post(
  "/categories",
  validateRequest({ body: createCategoryBodySchema }),
  createCategory,
);
adminRouter.get(
  "/categories/:categoryId",
  validateRequest({ params: categoryIdParamsSchema }),
  getCategory,
);
adminRouter.patch(
  "/categories/:categoryId",
  validateRequest({
    params: categoryIdParamsSchema,
    body: updateCategoryBodySchema,
  }),
  updateCategory,
);
adminRouter.delete(
  "/categories/:categoryId",
  validateRequest({ params: categoryIdParamsSchema }),
  deleteCategory,
);

adminRouter.get("/brands", listBrands);
adminRouter.post(
  "/brands",
  validateRequest({ body: createBrandBodySchema }),
  createBrand,
);
adminRouter.get(
  "/brands/:brandId",
  validateRequest({ params: brandIdParamsSchema }),
  getBrand,
);
adminRouter.patch(
  "/brands/:brandId",
  validateRequest({ params: brandIdParamsSchema, body: updateBrandBodySchema }),
  updateBrand,
);
adminRouter.delete(
  "/brands/:brandId",
  validateRequest({ params: brandIdParamsSchema }),
  deleteBrand,
);

adminRouter.get(
  "/orders",
  validateRequest({ query: ordersQuerySchema }),
  listOrders,
);
adminRouter.get(
  "/orders/:orderId",
  validateRequest({ params: orderIdParamsSchema }),
  getOrder,
);
adminRouter.get(
  "/orders/:orderId/items",
  validateRequest({ params: orderIdParamsSchema }),
  getOrderItems,
);
adminRouter.patch(
  "/orders/:orderId/status",
  validateRequest({
    params: orderIdParamsSchema,
    body: updateOrderStatusBodySchema,
  }),
  updateOrderStatus,
);
adminRouter.delete(
  "/orders/:orderId",
  validateRequest({ params: orderIdParamsSchema }),
  deleteOrder,
);

adminRouter.get(
  "/payments",
  validateRequest({ query: paymentsQuerySchema }),
  listPayments,
);
adminRouter.get(
  "/payments/:reference",
  validateRequest({ params: paymentReferenceParamsSchema }),
  getPayment,
);
adminRouter.patch(
  "/payments/:reference/status",
  validateRequest({
    params: paymentReferenceParamsSchema,
    body: updatePaymentStatusBodySchema,
  }),
  updatePaymentStatus,
);
adminRouter.delete(
  "/payments/:reference",
  validateRequest({ params: paymentReferenceParamsSchema }),
  deletePayment,
);

adminRouter.get("/coupons", listCoupons);
adminRouter.post(
  "/coupons",
  validateRequest({ body: createCouponBodySchema }),
  createCoupon,
);
adminRouter.get(
  "/coupons/:couponId",
  validateRequest({ params: couponIdParamsSchema }),
  getCoupon,
);
adminRouter.patch(
  "/coupons/:couponId",
  validateRequest({ params: couponIdParamsSchema, body: updateCouponBodySchema }),
  updateCoupon,
);
adminRouter.delete(
  "/coupons/:couponId",
  validateRequest({ params: couponIdParamsSchema }),
  deleteCoupon,
);

export default adminRouter;
