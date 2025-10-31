
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";

// Authorization Middleware
export const authorize = (...allowedRoles: string[]) => {

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};
