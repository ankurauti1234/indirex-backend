import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "./env";

export interface AccessPayload {
  id: string;
  role: string;
}

export interface RefreshPayload {
  id: string;
}

const getSecret = (secret: string | undefined, fallback: string): Secret => {
  const s = secret ?? fallback;
  if (!s) throw new Error("JWT secret is missing");
  return s as Secret;
};

const getExpiresIn = (
  val: string | undefined, 
  fallback: string
): SignOptions["expiresIn"] => {
  return (val ?? fallback) as SignOptions["expiresIn"];
};

export const generateAccessToken = (payload: AccessPayload): string => {
  const secret = getSecret(env.jwt.secret, "fallback-jwt-secret-change-me");
  const options: SignOptions = {
    expiresIn: getExpiresIn(env.jwt.expiresIn, "1h"),
  };
  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (payload: RefreshPayload): string => {
  const secret = getSecret(env.jwt.refreshSecret, "fallback-refresh-secret-change-me");
  const options: SignOptions = {
    expiresIn: getExpiresIn(env.jwt.refreshExpiresIn, "7d"),
  };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = <T extends object>(token: string, secret: string): T => {
  return jwt.verify(token, secret as Secret) as T;
};
