import { Schema, model } from "mongoose";
import { IActivityLog } from "../types/type";

const activityLogSchema = new Schema<IActivityLog>({
  taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  changes: [
    {
      field: String,
      oldValue: String,
      newValue: String,
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

export const ActivityLog = model<IActivityLog>("ActivityLog", activityLogSchema);
