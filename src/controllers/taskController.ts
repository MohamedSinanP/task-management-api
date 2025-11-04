import { Request, Response } from "express";
import { Task } from "../models/taskModel";
import { Project } from "../models/projectModel";
import { ActivityLog } from "../models/activeLogModel";
import { getIO, sendNotification } from "../socket";
import { Notification } from "../models/notificationModel";
import { User } from "../models/userModel";

// ==========================
// SOCKET EVENT CONSTANTS
// ==========================
const SOCKET_EVENTS = {
  TASK_ASSIGNED: "taskAssigned",
  TASK_UPDATED: "taskUpdated",
  TASK_DELETED: "taskDeleted",
};

const ROOM_PREFIX = {
  USER: "user:",
  TASK: "task:",
};

// =============================================================
//  CREATE TASK (Admin only)
// =============================================================
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assignedTo } = req.body;
    const user = (req as any).user; // logged-in user

    // Only admin can create a task
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can create tasks" });
    }

    // Validate required fields
    if (!title || !projectId || !assignedTo) {
      return res.status(400).json({ message: "Title, projectId, and assignedTo are required" });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Create the new task
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assignedTo,
      createdBy: user.id,
    });

    // Create notification for assigned user
    const notification = await Notification.create({
      userId: assignedTo,
      taskId: task._id,
      projectId,
      message: `You have been assigned a new task: "${title}"`,
      type: "task_assigned",
    });

    // Populate for returning and emitting
    const populatedTask = await task.populate([
      { path: "projectId", select: "name" },
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);

    const populatedNotification = await Notification.findById(notification._id)
      .populate("taskId", "title status priority")
      .populate("projectId", "name");

    // ==========================
    // SOCKET EMITS
    // ==========================
    try {
      const io = getIO();

      // Send to assigned user
      io.to(`${ROOM_PREFIX.USER}${assignedTo}`).emit(SOCKET_EVENTS.TASK_ASSIGNED, populatedTask);

      // Send structured notification to user
      sendNotification(String(assignedTo), populatedNotification);

    } catch (socketError) {
      console.error("Socket emit failed:", socketError);
    }

    res.status(201).json({ message: "Task created successfully", task: populatedTask });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
};

// =============================================================
// GET ALL TASKS (Admin or Assigned User)
// =============================================================
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let tasks;

    if (user.role === "admin") {
      tasks = await Task.find({ isDeleted: false })
        .populate("projectId", "name")
        .populate("assignedTo", "name email");
    } else {
      tasks = await Task.find({ assignedTo: user.id, isDeleted: false })
        .populate("projectId", "name")
        .populate("assignedTo", "name email");
    }

    res.status(200).json({ tasks });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
};

// =============================================================
// GET SINGLE TASK
// =============================================================
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const task = await Task.findById(id)
      .populate("projectId", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Access control
    if (user.role !== "admin" && task.assignedTo?.toString() !== user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    res.status(200).json({ task });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch task", error: error.message });
  }
};

// =============================================================
// UPDATE TASK (Admin or Assigned User)
// =============================================================
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = (req as any).user;


    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Role-based access check
    if (user.role !== "admin" && task.assignedTo?.toString() !== user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    // Identify changed fields
    const changedFields: any[] = [];
    const updatableFields = ["title", "description", "status", "priority", "dueDate", "assignedTo", "projectId"];

    for (const key of updatableFields) {
      if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;

      const oldValue = (task as any)[key];
      const newValue = updates[key];

      const oldValStr = oldValue?.toString?.() ?? oldValue;
      const newValStr = newValue?.toString?.() ?? newValue;

      if (oldValStr !== newValStr) {
        changedFields.push({
          field: key,
          oldValue: oldValue,
          newValue: newValue,
        });
        (task as any)[key] = newValue;
      }
    }

    await task.save();


    await task.save();

    const io = getIO();
    const notifications: any[] = [];
    const notificationsToEmit: any[] = [];

    // --- Detect major changes ---
    const assignedChange = changedFields.find((f) => f.field === "assignedTo");
    const statusChange = changedFields.find((f) => f.field === "status");

    // Notify new assigned user (if reassigned)
    if (assignedChange) {
      notifications.push({
        userId: updates.assignedTo,
        message: `You have been assigned to task "${task.title}"`,
        type: "task_assigned",
        taskId: task._id,
        projectId: task.projectId,
      });
      io.to(`${ROOM_PREFIX.USER}${updates.assignedTo}`).emit(SOCKET_EVENTS.TASK_ASSIGNED, task);
    }

    // Notify assigned user if admin updated their task
    if (
      user.role === "admin" &&
      (statusChange || changedFields.length > 0) &&
      task.assignedTo?.toString() !== user.id.toString()
    ) {
      notifications.push({
        userId: task.assignedTo,
        message: `Task "${task.title}" has been updated by the admin`,
        type: "task_updated",
        taskId: task._id,
        projectId: task.projectId,
      });
    }

    // Notify admin if user updated their assigned task
    if (user.role !== "admin") {
      const admin = await User.findOne({ role: "admin" }).select("_id name");
      if (admin) {
        notifications.push({
          userId: admin._id,
          message: `Task "${task.title}" was updated by ${user.name}`,
          type: "task_updated",
          taskId: task._id,
          projectId: task.projectId,
        });
      }
    }

    // Save notifications & emit them
    if (notifications.length > 0) {
      const created = await Notification.insertMany(notifications, { ordered: false });
      const populated = await Notification.find({
        _id: { $in: created.map((n) => n._id) },
      })
        .populate("taskId", "title status priority")
        .populate("projectId", "name")
        .populate("userId", "name email role");

      populated.forEach((notif) => sendNotification(notif.userId._id.toString(), notif));
      notificationsToEmit.push(...populated);
    }

    // Log changes
    if (changedFields.length > 0) {
      await ActivityLog.create({
        taskId: task._id,
        updatedBy: user.id,
        changes: changedFields,
      });
    }

    // Populate task for return & emit
    const populatedTask = await task.populate([
      { path: "projectId", select: "name" },
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);

    // Emit task update to all users in task room
    io.to(`${ROOM_PREFIX.TASK}${task._id}`).emit(SOCKET_EVENTS.TASK_UPDATED, populatedTask);

    res.status(200).json({
      message: "Task updated successfully",
      task: populatedTask,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update task", error: error.message });
  }
};

// =============================================================
// DELETE TASK (Admin only)
// =============================================================
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete tasks" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.isDeleted) {
      return res.status(400).json({ message: "Task is already deleted" });
    }

    task.isDeleted = true;
    await task.save();
    const newNotification = await Notification.create({
      userId: task.assignedTo,
      message: `The task you were assigned to, "${task.title}", has been deleted by admin.`,
      type: "task_deleted",
      taskId: task._id,
      projectId: task.projectId,
    });
    const populatedNotification = await Notification.findById({ _id: newNotification._id })
      .populate("taskId", "title status priority")
      .populate("projectId", "name")
      .populate("userId", "name email role");
    console.log("this is the updated notification", populatedNotification);

    // Emit to all listeners of this task and assigned user
    try {
      const io = getIO();
      io.to(`${ROOM_PREFIX.TASK}${id}`).emit(SOCKET_EVENTS.TASK_DELETED, { _id: id });
      sendNotification(newNotification.userId.toString(), populatedNotification);
      // if (task.assignedTo) {
      //   io.to(`${ROOM_PREFIX.USER}${task.assignedTo}`).emit(SOCKET_EVENTS.TASK_DELETED, { _id: id });
      // }

    } catch (socketError) {
      console.error("Socket emit failed:", socketError);
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
};
