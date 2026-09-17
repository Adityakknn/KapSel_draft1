import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { PerananAdmin } from "shared";

export interface AdminTokenPayload {
  sub: string; // AdminUser.id
  email: string;
  peran: PerananAdmin;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AdminTokenPayload;
}
