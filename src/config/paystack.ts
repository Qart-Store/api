import env from "./env.js";

const paystackConfig = {
  baseUrl: env.PAYSTACK_BASE_URL.replace(/\/+$/, ""),
  secretKey: env.PAYSTACK_SECRET_KEY,
} as const;

export default paystackConfig;
