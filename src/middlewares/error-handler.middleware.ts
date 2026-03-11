import { NextFunction, Request, Response } from "express";
import AppError from "../utils/app-error";
import { sendError } from "../utils/api-response";

function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const appError = error instanceof AppError ? error : null;
  const statusCode =
    appError?.statusCode ?? (res.statusCode >= 400 ? res.statusCode : 500);
  const message = appError?.message || error.message || "Internal server error";
  const data =
    appError?.data ??
    (process.env.NODE_ENV === "production" ? null : { stack: error.stack });

  return sendError(
    res,
    message,
    statusCode,
    data,
    appError?.status ?? "failed",
  );
}

export default errorHandler;
