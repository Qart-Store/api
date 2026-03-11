import { Response } from "express";

function sendResponse<T>(
  res: Response,
  { statusCode = 200, status, message, data = null }: SendResponseOptions<T>,
) {
  return res.status(statusCode).json({
    status,
    message,
    data,
  } satisfies ApiResponseBody<T>);
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T | null,
  statusCode = 200,
  status: SuccessApiResponseStatus = "success",
) {
  return sendResponse(res, {
    statusCode,
    status,
    message,
    data,
  });
}

export function sendError<T>(
  res: Response,
  message: string,
  statusCode = 500,
  data?: T | null,
  status: ErrorApiResponseStatus = "failed",
) {
  return sendResponse(res, {
    statusCode,
    status,
    message,
    data,
  });
}
