import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/api-response.js";

function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    null,
    "error",
  );
}

export default notFoundHandler;
