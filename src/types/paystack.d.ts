interface PaystackApiResponse<TData> {
  status: boolean;
  message: string;
  data: TData;
}

interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyResponse {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  gateway_response?: string;
  paid_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface InitializePaystackTransactionInput {
  email: string;
  amount: number;
  reference: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}
