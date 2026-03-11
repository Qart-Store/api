interface CartItemEntity {
  customerId: string;
  productId: string;
  quantity: number;
  color: string | null;
  size: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CartProductItem {
  customerId: string;
  productId: string;
  quantity: number;
  color: string | null;
  size: string | null;
  productName: string;
  imageUrl: string | null;
  price: number;
  stock: number;
  status: ProductStatus;
  lineTotal: number;
}

interface CartSummary {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
}

interface CreateOrderInput {
  couponCode?: string | null;
  shippingFullName: string;
  shippingEmail: string;
  shippingPhone?: string | null;
  shippingLocation: string;
  shippingAddress?: Record<string, unknown> | null;
  notes?: string | null;
}

interface OrderEntity {
  id: string;
  customerId: string;
  orderNumber: string;
  status:
    | "pending"
    | "paid"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "failed";
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
  shippingFullName: string | null;
  shippingEmail: string | null;
  shippingPhone: string | null;
  shippingLocation: string | null;
  shippingAddress: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderItemEntity {
  id: number;
  orderId: string;
  productId: string | null;
  productName: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: string;
}

interface WishlistItemEntity {
  customerId: string;
  productId: string;
  createdAt: string;
}

interface WishlistProductEntity {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  status: ProductStatus;
  createdAt: string;
}

interface PaymentTransactionEntity {
  id: string;
  customerId: string;
  orderId: string | null;
  reference: string;
  provider: string;
  status: "pending" | "success" | "failed" | "abandoned";
  amount: number;
  currency: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
