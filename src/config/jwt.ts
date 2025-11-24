import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "./env";

/**
 * Payload that goes into the **access** token.
 */
export interface AccessPayload {
  id: string;
  role: string;
}

/**
 * Payload that goes into the **refresh** token (only id is needed).
 */
export interface RefreshPayload {
  id: string;
}

/* ------------------------------------------------------------------ */
/*  Helper – guarantees the secret is a valid jwt.Secret               */
/* ------------------------------------------------------------------ */
const getSecret = (secret: string | undefined, fallback: string): Secret => {
  const s = secret ?? fallback;
  if (!s) throw new Error("JWT secret is missing");
  return s as Secret;
};

/* ------------------------------------------------------------------ */
/*  Helper – safely cast expiresIn to valid SignOptions type           */
/* ------------------------------------------------------------------ */
const getExpiresIn = (val: string | undefined, fallback: string): SignOptions["expiresIn"] => {
  // jsonwebtoken accepts number or "1h", "7d", etc.
  return (val ?? fallback) as SignOptions["expiresIn"];
};

/* ------------------------------------------------------------------ */
/*  Access token (short-lived)                                         */
/* ------------------------------------------------------------------ */
export const generateAccessToken = (payload: AccessPayload): string => {
  const secret = getSecret(env.jwtSecret, "fallback-jwt-secret-change-me");
  const options: SignOptions = { expiresIn: getExpiresIn(env.jwtExpiresIn, "1h") };
  return jwt.sign(payload, secret, options);
};

/* ------------------------------------------------------------------ */
/*  Refresh token (long-lived)                                         */
/* ------------------------------------------------------------------ */
export const generateRefreshToken = (payload: RefreshPayload): string => {
  const secret = getSecret(env.jwtRefreshSecret, "fallback-refresh-secret-change-me");
  const options: SignOptions = { expiresIn: getExpiresIn(env.jwtRefreshExpiresIn, "7d") };
  return jwt.sign(payload, secret, options);
};

/* ------------------------------------------------------------------ */
/*  Verify any token                                                   */
/* ------------------------------------------------------------------ */
export const verifyToken = <T extends object>(token: string, secret: string): T => {
  return jwt.verify(token, secret as Secret) as T;
};
