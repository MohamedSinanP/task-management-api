import { Request, Response, NextFunction } from "express";
import { AccessPayload } from "../types/type";
import { User } from "../models/userModel";
import { verifyAccessToken } from "../utils/tokenUtils";

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
      return res.status(401).json({ message: "Access token Required." });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Unauthorized: invalid token" });
  }
};
