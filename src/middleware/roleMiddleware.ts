
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
import { STATUS_CODES } from "../utils/constants";

// Authorization Middleware
export const authorize = (...allowedRoles: string[]) => {

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "Access denied" });
    }

    next();
  };
};
