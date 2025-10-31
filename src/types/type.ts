import { Request } from "express";
import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog extends Document {
  taskId: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  };
  updatedAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: "Todo" | "In-Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  dueDate: Date;
  projectId: mongoose.Types.ObjectId | IProject;
  assignedTo?: mongoose.Types.ObjectId | IUser;
  createdBy: mongoose.Types.ObjectId | IUser;
}

export interface IProject extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  message: string;
  type: "task_assigned" | "task_updated";
  taskId?: mongoose.Types.ObjectId | ITask;
  projectId?: mongoose.Types.ObjectId | IProject;
  isRead: boolean;
  createdAt: Date;
}

export interface AccessPayload {
  id: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AccessPayload;
}


