import mongoose from "mongoose";
import { INotification } from "../types/type";

const notificationSchema = new mongoose.Schema<INotification>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["task_assigned", "task_updated", "task_deleted"],
      required: true,
    },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: "15d" },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
