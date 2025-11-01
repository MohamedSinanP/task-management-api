import { Request, Response } from "express";
import { User } from "../models/userModel";
import { ROLES, STATUS_CODES } from "../utils/constants";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: ROLES.USER }).select("name role email");

    if (!users || users.length === 0) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "No users found." });
    }

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Users fetched successfully.",
      users,
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};
