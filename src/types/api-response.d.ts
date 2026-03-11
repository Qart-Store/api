type ApiResponseStatus = "success" | "failed" | "ok" | "pending" | "error";

type SuccessApiResponseStatus = Extract<
  ApiResponseStatus,
  "success" | "ok" | "pending"
>;

type ErrorApiResponseStatus = Extract<ApiResponseStatus, "failed" | "error">;

interface ApiResponseBody<T> {
  status: ApiResponseStatus;
  message: string;
  data: T | null;
}

interface SendResponseOptions<T> {
  statusCode?: number;
  status: ApiResponseStatus;
  message: string;
  data?: T | null;
}
