import { Schema, model } from "mongoose";
import { IProject } from "../types/type";

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Project = model<IProject>("Project", projectSchema);
