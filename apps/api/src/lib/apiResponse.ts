import type { Response } from "express";

/** Format response API seragam di seluruh endpoint: { success, data } atau { success: false, error }. */
export function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function fail(
  res: Response,
  status: number,
  message: string,
  details?: unknown
): void {
  res.status(status).json({ success: false, error: { message, details } });
}
