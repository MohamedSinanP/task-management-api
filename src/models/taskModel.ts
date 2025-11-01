import { Schema, model } from "mongoose";
import { ITask } from "../types/type";



const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: { type: String, enum: ["Todo", "In-Progress", "Done"], default: "Todo" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    dueDate: { type: Date },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Task = model<ITask>("Task", taskSchema);
