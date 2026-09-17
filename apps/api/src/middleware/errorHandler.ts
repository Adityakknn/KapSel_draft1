import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/AppError.js";
import { fail } from "../lib/apiResponse.js";
import { logger } from "../logger.js";

/** Satu tempat penanganan error untuk semua route - jamin response format konsisten & tidak ada error yang silent. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    fail(res, err.status, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    fail(res, 400, "Data yang dikirim tidak valid.", err.flatten());
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error di API");
  fail(res, 500, "Terjadi kendala teknis di server. Silakan coba lagi.");
}

export function notFoundHandler(req: Request, res: Response): void {
  fail(res, 404, `Endpoint ${req.method} ${req.path} tidak ditemukan.`);
}
