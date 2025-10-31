import { Request, Response } from "express";
import { Task } from "../models/taskModel";
import { Project } from "../models/projectModel";
import { ActivityLog } from "../models/activeLogModel";
import { getIO, sendAdminNotification, sendNotification } from "../socket";
import { Notification } from "../models/notificationModel";

// Create new task (Admin only)
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assignedTo } = req.body;
    const user = (req as any).user;

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can create tasks" });
    }

    if (!title || !projectId || !assignedTo) {
      return res.status(400).json({ message: "Title, projectId, and assignedTo are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

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

    // Populate notification
    const populatedNotification = await Notification.findById(notification._id)
      .populate("taskId", "title status priority")
      .populate("projectId", "name");

    const populatedTask = await task.populate([
      { path: "projectId", select: "name" },
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);
    // Emit Socket.IO events
    const io = getIO();

    // Send to project room
    console.log("assinged user id : ", assignedTo.toString());

    io.to(`user:${assignedTo.toString()}`).emit("taskAssigned", populatedTask);

    // Send notification to assigned user
    sendNotification(assignedTo.toString(), populatedNotification);

    // Send to admin dashboard
    sendAdminNotification({
      type: "task_created",
      task,
      notification: populatedNotification,
    });


    res.status(201).json({ message: "Task created successfully", task: populatedTask });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
};


//  Get all tasks 
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let tasks;

    if (user.role === "admin") {
      tasks = await Task.find()
        .populate("projectId", "name")
        .populate("assignedTo", "name email");
    } else {
      tasks = await Task.find({ assignedTo: user.id })
        .populate("projectId", "name")
        .populate("assignedTo", "name email");
    }

    res.status(200).json({ tasks });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
};

// Get single task
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

    // Restrict access if not admin or assigned user
    if (user.role !== "admin" && task.assignedTo?.toString() !== user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    res.status(200).json({ task });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch task", error: error.message });
  }
};

// Update task
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = (req as any).user;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Role-based check
    if (user.role !== "admin" && task.assignedTo?.toString() !== user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    // Compare old vs new for activity log
    const changedFields: any[] = [];
    const updatableFields = ["title", "description", "status", "priority", "dueDate", "assignedTo"];

    for (const key of updatableFields) {
      if (updates[key] && updates[key] !== (task as any)[key]) {
        changedFields.push({
          field: key,
          oldValue: (task as any)[key],
          newValue: updates[key],
        });
        (task as any)[key] = updates[key];
      }
    }

    await task.save();

    // ---- Notification logic ----
    const notifications: any[] = [];
    const notificationsToEmit: any[] = [];

    // Find which fields changed
    const assignedChange = changedFields.find((f) => f.field === "assignedTo");
    const statusChange = changedFields.find((f) => f.field === "status");

    // Notify assigned user if they got newly assigned
    if (assignedChange) {
      const notification = {
        userId: updates.assignedTo,
        message: `You have been assigned to task "${task.title}"`,
        type: "task_assigned" as const,
        taskId: task._id,
        projectId: task.projectId,
      };
      notifications.push(notification);
    }

    // Notify the assigned user when the task is updated (but not if they made the update)
    if ((statusChange || changedFields.length > 0) && task.assignedTo?.toString() !== user.id.toString()) {
      const notification = {
        userId: task.assignedTo,
        message: `Task "${task.title}" has been updated`,
        type: "task_updated" as const,
        taskId: task._id,
        projectId: task.projectId,
      };
      notifications.push(notification);
    }

    // Notify admin if non-admin updated the task
    if (user.role !== "admin" && task.createdBy?.toString() !== user.id.toString()) {
      const notification = {
        userId: task.createdBy,
        message: `Task "${task.title}" was updated by ${user.name}`,
        type: "task_updated" as const,
        taskId: task._id,
        projectId: task.projectId,
      };
      notifications.push(notification);
    }

    // Bulk insert notifications
    if (notifications.length > 0) {
      const createdNotifications = await Notification.insertMany(notifications);

      // Populate notifications for socket emission
      for (const notif of createdNotifications) {
        const populated = await Notification.findById(notif._id)
          .populate("taskId", "title status priority")
          .populate("projectId", "name")
          .populate("userId", "name email role");
        notificationsToEmit.push(populated);
      }
    }

    // Log changes if any
    if (changedFields.length > 0) {
      await ActivityLog.create({
        taskId: task._id,
        updatedBy: user.id,
        changes: changedFields,
      });
    }

    // Emit socket events
    const io = getIO();
    const populatedTask = await task.populate([
      { path: "projectId", select: "name" },
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);

    // Send to task room
    io.to(`task:${String(task._id)}`).emit("taskUpdated", populatedTask);
    // Send notifications via socket
    notificationsToEmit.forEach((notification) => {
      sendNotification(notification.userId._id.toString(), notification);
    });

    // Send to admin dashboard
    sendAdminNotification({
      type: "task_updated",
      task: populatedTask,
      updatedBy: user,
      changes: changedFields,
    });

    res.status(200).json({
      message: "Task updated successfully",
      task: populatedTask,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update task", error: error.message });
  }
};

//  Delete task (Admin only)
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

    const projectId = task.projectId.toString();

    await task.deleteOne();

    // Emit deletion to project room
    const io = getIO();
    io.to(`task:${id}`).emit("taskDeleted", { _id: id });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
};
