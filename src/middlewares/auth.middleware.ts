import { NextFunction, Request, Response } from "express";
import AppError from "../utils/app-error";
import { verifyAuthToken } from "../utils/token";

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    throw new AppError("Authentication required", 401, "failed");
  }

  const payload = verifyAuthToken(token);
  req.authUser = {
    id: payload.sub,
    email: payload.email,
  };

  next();
}

export default authMiddleware;
