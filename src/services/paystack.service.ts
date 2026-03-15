import crypto from "crypto";
import paystackConfig from "../config/paystack";
import AppError from "../utils/app-error";

function getPaystackSecretKey() {
  const key = paystackConfig.secretKey?.trim();
  if (!key) {
    throw new AppError("PAYSTACK_SECRET_KEY is not configured", 500, "failed");
  }

  return key;
}

async function paystackRequest<TData>(
  endpoint: string,
  init: RequestInit,
): Promise<TData> {
  const secretKey = getPaystackSecretKey();
  const baseUrl = paystackConfig.baseUrl;

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const body = (await response.json()) as PaystackApiResponse<TData>;

  if (!response.ok || !body.status) {
    throw new AppError(
      body.message || "Paystack request failed",
      502,
      "failed",
    );
  }

  return body.data;
}

export async function initializePaystackTransaction(
  input: InitializePaystackTransactionInput,
): Promise<PaystackInitializeResponse> {
  const payload = {
    email: input.email.trim().toLowerCase(),
    amount: Math.round(input.amount),
    reference: input.reference,
    currency: input.currency ?? "NGN",
    metadata: input.metadata,
  };

  return paystackRequest<PaystackInitializeResponse>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResponse> {
  const encodedReference = encodeURIComponent(reference);

  return paystackRequest<PaystackVerifyResponse>(
    `/transaction/verify/${encodedReference}`,
    {
      method: "GET",
    },
  );
}

export function mapPaystackStatusToPaymentStatus(
  paystackStatus: string,
): PaymentTransactionEntity["status"] {
  const normalizedStatus = paystackStatus.trim().toLowerCase();

  if (normalizedStatus === "success") return "success";
  if (normalizedStatus === "failed") return "failed";
  if (normalizedStatus === "abandoned") return "abandoned";

  return "pending";
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
): boolean {
  if (!signatureHeader) return false;

  const secretKey = paystackConfig.secretKey?.trim();
  if (!secretKey) return false;

  const computedSignature = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody, "utf8")
    .digest("hex");

  const provided = Buffer.from(signatureHeader, "hex");
  const computed = Buffer.from(computedSignature, "hex");

  if (provided.length !== computed.length) {
    return false;
  }

  return crypto.timingSafeEqual(provided, computed);
}
