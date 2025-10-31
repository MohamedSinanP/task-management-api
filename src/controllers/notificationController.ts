import { Request, Response } from "express";
import { Notification } from "../models/notificationModel";

export const createNotification = async ({
  userId,
  message,
  type,
  taskId,
  projectId,
}: {
  userId: string;
  message: string;
  type: "task_assigned" | "task_updated";
  taskId?: string;
  projectId?: string;
}) => {
  return await Notification.create({
    userId,
    message,
    type,
    taskId,
    projectId,
  });
};

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const notifications = await Notification.find({ userId: user.id })
      .populate({
        path: "taskId",
        select: "title status priority",
      })
      .populate({
        path: "projectId",
        select: "name",
      })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: user.id,
      isRead: false,
    });

    res.status(200).json({
      message: "Notifications fetched successfully",
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// Get all notifications (Admin only)
export const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const notifications = await Notification.find()
      .populate({
        path: "userId",
        select: "name email role",
      })
      .populate({
        path: "taskId",
        select: "title status priority",
      })
      .populate({
        path: "projectId",
        select: "name",
      })
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({
      isRead: false,
    });

    console.log("notifications :", notifications);


    res.status(200).json({
      message: "All notifications fetched successfully",
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Users can only mark their own notifications as read (unless admin)
    if (
      user.role !== "admin" &&
      notification.userId.toString() !== user.id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    await Notification.updateMany(
      { userId: user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Users can only delete their own notifications (unless admin)
    if (
      user.role !== "admin" &&
      notification.userId.toString() !== user.id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await notification.deleteOne();

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const unreadCount = await Notification.countDocuments({
      userId: user.id,
      isRead: false,
    });

    res.status(200).json({
      unreadCount,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};