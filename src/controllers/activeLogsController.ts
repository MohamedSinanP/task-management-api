import { Request, Response } from "express";
import { ActivityLog } from "../models/activeLogModel";
import { STATUS_CODES } from "../utils/constants";

export const getAllActivityLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalLogs = await ActivityLog.countDocuments();
    const logs = await ActivityLog.find()
      .populate({
        path: "taskId",
        select: "title projectId",
        populate: { path: "projectId", select: "name" },
      })
      .populate({
        path: "updatedBy",
        select: "name email role",
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Activity logs fetched successfully",
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
        totalItems: totalLogs,
        itemsPerPage: limit,
      },
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch activity logs",
      error: error.message,
    });
  }
};