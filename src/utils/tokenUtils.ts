import jwt from "jsonwebtoken";
import { AccessPayload } from "../types/type";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

export const generateAccessToken = (payload: AccessPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): AccessPayload | null => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessPayload;
    return decoded;
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): AccessPayload | null => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as AccessPayload;
    return decoded;
  } catch (err) {
    return null;
  }
};