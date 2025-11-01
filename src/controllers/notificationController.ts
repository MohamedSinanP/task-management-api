import { Request, Response } from "express";
import { Notification } from "../models/notificationModel";
import { STATUS_CODES, ROLES } from "../utils/constants";

/**
 * Create a new notification (used internally by task/project services)
 */
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

/**
 * Get notifications for the logged-in user
 */
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const notifications = await Notification.find({ userId: user.id })
      .populate({ path: "taskId", select: "title status priority" })
      .populate({ path: "projectId", select: "name" })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: user.id,
      isRead: false,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Notifications fetched successfully",
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * Get all notifications (Admin only)
 */
export const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== ROLES.ADMIN) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "Access denied" });
    }

    const notifications = await Notification.find()
      .populate({ path: "userId", select: "name email role" })
      .populate({ path: "taskId", select: "title status priority" })
      .populate({ path: "projectId", select: "name" })
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.status(STATUS_CODES.SUCCESS).json({
      message: "All notifications fetched successfully",
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * Mark a specific notification as read
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "Notification not found" });
    }

    // Only admin or the owner of the notification can mark as read
    if (
      user.role !== ROLES.ADMIN &&
      notification.userId.toString() !== user.id.toString()
    ) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "Access denied" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read for the logged-in user
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    await Notification.updateMany(
      { userId: user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(STATUS_CODES.SUCCESS).json({
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

/**
 * Delete a specific notification
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "Notification not found" });
    }

    // Only admin or the owner of the notification can delete
    if (
      user.role !== ROLES.ADMIN &&
      notification.userId.toString() !== user.id.toString()
    ) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "Access denied" });
    }

    await notification.deleteOne();

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Notification deleted successfully",
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

/**
 * Get count of unread notifications for the logged-in user
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const unreadCount = await Notification.countDocuments({
      userId: user.id,
      isRead: false,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      unreadCount,
    });
  } catch (error: any) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};
