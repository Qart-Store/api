import { NextFunction, Request, Response } from "express";
import AppError from "../utils/app-error.js";
import { sendError } from "../utils/api-response.js";

function redactSensitive(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitive(entry));
  }

  const blockedKeys = new Set([
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
    "cookie",
    "smtpPass",
    "smtpPassword",
  ]);

  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (blockedKeys.has(key)) {
      output[key] = "[REDACTED]";
      continue;
    }

    output[key] = redactSensitive(raw);
  }

  return output;
}

function errorHandler(
  error: Error,
  req: Request,
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

  console.error("[API_ERROR]", {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    name: error.name,
    stack: error.stack,
    params: redactSensitive(req.params),
    query: redactSensitive(req.query),
    body: redactSensitive(req.body),
    authUserId: req.authUser?.id,
    ip: req.ip,
  });

  return sendError(
    res,
    message,
    statusCode,
    data,
    appError?.status ?? "failed",
  );
}

export default errorHandler;
