import { NextFunction, Request, Response } from "express";
import { z, ZodSchema } from "zod";
import AppError from "../utils/app-error.js";

interface ValidateRequestSchema {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

function formatZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

function validateOrThrow(schema: ZodSchema | undefined, value: unknown) {
  if (!schema) return value;

  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError("Validation failed", 400, "failed", {
      issues: formatZodIssues(result.error),
    });
  }

  return result.data;
}

function validateRequest(schema: ValidateRequestSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = validateOrThrow(schema.body, req.body);
    req.params = validateOrThrow(
      schema.params,
      req.params,
    ) as Request["params"];

    if (schema.query) {
      const validatedQuery = validateOrThrow(schema.query, req.query) as Record<
        string,
        unknown
      >;
      const queryTarget = req.query as Record<string, unknown>;

      for (const key of Object.keys(queryTarget)) {
        delete queryTarget[key];
      }

      Object.assign(queryTarget, validatedQuery);
    }

    next();
  };
}

export default validateRequest;
