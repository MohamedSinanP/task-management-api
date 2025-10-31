import { Request, Response } from "express";
import { User } from "../models/userModel";
import { ROLES, STATUS_CODES } from "../utils/constants";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: ROLES.USER }).select('name role email');
    if (!users) {
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch Users", users: users })
    }

    res.status(STATUS_CODES.SUCCESS).json({ message: "Users fetched successfully.", users: users })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch Users", error: error.message });

  }
}