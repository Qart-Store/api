import { NextFunction, Request, Response } from "express";

import AppError from "../utils/app-error.js";

/**
 * Admin authentication middleware.
 *
 * Supports either:
 * - x-admin-key header
 * - Authorization: Bearer <ADMIN_API_KEY>
 */
function adminAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const adminKeyFromHeader = req.headers["x-admin-key"];
  const bearerHeader = req.headers.authorization;

  const normalizedHeaderKey = Array.isArray(adminKeyFromHeader)
    ? adminKeyFromHeader[0]
    : adminKeyFromHeader;
  const normalizedBearer = bearerHeader?.startsWith("Bearer ")
    ? bearerHeader.slice(7).trim()
    : null;

  const providedKey = normalizedHeaderKey ?? normalizedBearer;

  if (!process.env.ADMIN_API_KEY?.trim()) {
    throw new AppError(
      "ADMIN_API_KEY is not configured on the server",
      500,
      "error",
    );
  }

  if (!providedKey || providedKey !== process.env.ADMIN_API_KEY) {
    throw new AppError("Admin authentication required", 401, "failed");
  }

  next();
}

export default adminAuthMiddleware;
