import cron from "node-cron";
import { Task } from "../models/taskModel";
import { sendMail } from "../utils/mailService";
import { IProject, IUser } from "../types/type";

// Runs every day at 8:00 AM
cron.schedule("0 8 * * *", async () => {
  console.log("Running Daily Reminder Job...");

  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks due within next 24 hours
    const tasks = await Task.find({
      isDeleted: false,
      dueDate: { $gte: now, $lte: next24Hours },
      status: { $ne: "Done" },
    })
      .populate<{ assignedTo: IUser }>("assignedTo", "email name")
      .populate<{ projectId: IProject }>("projectId", "name");

    for (const task of tasks) {
      const user = task.assignedTo as any;
      if (!user?.email) continue;

      await sendMail({
        to: user.email,
        subject: "Task Reminder: Upcoming Due Date",
        title: `Reminder: ${task.title} is due soon`,
        body: `
          <p>Hi ${user.name || "User"},</p>
          <p>Your task <strong>${task.title}</strong> in project <strong>${task.projectId?.name}</strong> 
          is due by <strong>${task.dueDate.toLocaleString()}</strong>.</p>
          <p>Please make sure to complete it on time.</p>
          <p>– Task Manager</p>
        `,
      });
    }

    console.log(`Sent ${tasks.length} reminder emails.`);
  } catch (error) {
    console.error("Error in Daily Reminder Job:", error);
  }
});
