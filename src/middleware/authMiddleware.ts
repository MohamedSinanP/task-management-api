import { Request, Response, NextFunction } from "express";
import { AccessPayload } from "../types/type";
import { User } from "../models/userModel";
import { verifyAccessToken } from "../utils/tokenUtils";
import { STATUS_CODES } from "../utils/constants";

export interface AuthenticatedRequest extends Request {
  user?: AccessPayload;
}

// Authentication Middleware
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: "Access token Required." });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }

    req.user = { id: decoded.id, role: decoded.role, name: user.name };
    next();
  } catch (error) {
    return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Unauthorized: invalid token" });
  }
};
