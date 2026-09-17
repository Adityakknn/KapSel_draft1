/** Error terduga dengan status HTTP eksplisit (validasi, not found, unauthorized, dll). */
export class AppError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}
