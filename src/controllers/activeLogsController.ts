import { Request, Response } from "express";
import { ActivityLog } from "../models/activeLogModel";

export const getAllActivityLogs = async (req: Request, res: Response) => {
  try {
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
      .sort({ updatedAt: -1 });

    res.status(200).json({
      message: "Activity logs fetched successfully",
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch activity logs",
      error: error.message,
    });
  }
};
