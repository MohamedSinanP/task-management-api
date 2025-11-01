import cron from "node-cron";
import { Task } from "../models/taskModel";
import { sendMail } from "../utils/mailService";

// Runs every Friday at 9:00 AM
cron.schedule("0 9 * * 5", async () => {
  console.log("Running Weekly Summary Job...");

  try {
    const now = new Date();
    const currentDay = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDay + 1);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    console.log("Weekly range:", monday, "→", sunday);

    const tasks = await Task.find({
      isDeleted: false,
      $or: [
        { createdAt: { $gte: monday, $lte: sunday } },
        { updatedAt: { $gte: monday, $lte: sunday } },
        { dueDate: { $gte: monday, $lte: sunday } },
      ],
    })
      .populate("assignedTo", "name email")
      .populate("projectId", "name");

    if (tasks.length === 0) {
      console.log("No tasks found this week.");
      return;
    }

    const tasksByAssignee: Record<string, any[]> = {};
    for (const task of tasks) {
      const assignee = task.assignedTo as any;
      if (!assignee?._id) continue;
      const key = assignee._id.toString();
      if (!tasksByAssignee[key]) tasksByAssignee[key] = [];
      tasksByAssignee[key].push(task);
    }

    // Send weekly summary email to each assignee
    for (const [userId, userTasks] of Object.entries(tasksByAssignee)) {
      const assignee = userTasks[0].assignedTo as any;

      // Count tasks by status
      const stats: Record<string, number> = {};
      for (const task of userTasks) {
        stats[task.status] = (stats[task.status] || 0) + 1;
      }

      const total = userTasks.length;
      const summaryList = Object.entries(stats)
        .map(([status, count]) => `<li><b>${status}</b>: ${count}</li>`)
        .join("");

      const taskList = userTasks
        .slice(0, 5)
        .map(
          (t) => `
          <li>
            <b>${t.title}</b> (${t.status})<br/>
            Project: ${t.projectId?.name || "N/A"}<br/>
            Due: ${t.dueDate ? new Date(t.dueDate).toDateString() : "N/A"}
          </li>`
        )
        .join("");

      await sendMail({
        to: assignee.email,
        subject: `Your Weekly Task Summary (${monday.toDateString()} – ${sunday.toDateString()})`,
        title: `Weekly Task Summary`,
        body: `
          <p>Hi ${assignee.name || "there"},</p>
          <p>Here’s your weekly summary for tasks assigned to you:</p>
          <ul>${summaryList}</ul>
          <p><strong>Total Tasks This Week:</strong> ${total}</p>
          <h4>Highlights:</h4>
          <ul>${taskList}</ul>
          <p>Keep up the great work! 💪</p>
          <p>– Task Manager</p>
        `,
      });

      console.log(`Summary sent to ${assignee.email}`);
    }

    console.log("Weekly summaries sent successfully.");
  } catch (error) {
    console.error("Error in Weekly Summary Job:", error);
  }
});
