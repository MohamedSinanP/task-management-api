import cron from "node-cron";
import { Task } from "../models/taskModel";
import { Project } from "../models/projectModel";
import { sendMail } from "../utils/mailService";

// Runs every Friday at 9:00 AM
cron.schedule("0 9 * * 5", async () => {
  console.log("📊 Running Weekly Summary Job (Friday 9 AM)...");

  try {
    // 1️⃣ Get current week range
    const now = new Date();
    const currentDay = now.getDay(); // Sunday=0, Monday=1
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDay + 1);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    console.log("Weekly range:", monday, "→", sunday);

    // 2️⃣ Fetch all projects with their owners
    const projects = await Project.find().populate("createdBy", "email name");

    // 3️⃣ For each project, find tasks relevant to this week
    for (const project of projects) {
      const tasks = await Task.find({
        projectId: project._id,
        $or: [
          { createdAt: { $gte: monday, $lte: sunday } },
          { updatedAt: { $gte: monday, $lte: sunday } },
          { dueDate: { $gte: monday, $lte: sunday } },
        ],
      }).populate("assignedTo", "name email");

      if (tasks.length === 0) continue; // no updates this week

      // Group by status
      const stats = await Task.aggregate([
        {
          $match: {
            projectId: project._id,
            $or: [
              { createdAt: { $gte: monday, $lte: sunday } },
              { updatedAt: { $gte: monday, $lte: sunday } },
              { dueDate: { $gte: monday, $lte: sunday } },
            ],
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      const total = stats.reduce((acc, s) => acc + s.count, 0);
      const summaryList = stats
        .map((s) => `<li><b>${s._id}</b>: ${s.count}</li>`)
        .join("");

      // Create a short HTML snippet of key tasks
      const taskList = tasks
        .slice(0, 5)
        .map(
          (t) => `
          <li>
            <b>${t.title}</b> (${t.status}) 
            - due: ${t.dueDate ? new Date(t.dueDate).toDateString() : "N/A"}
          </li>`
        )
        .join("");

      // Send to project owner
      const owner = project.createdBy as any;
      if (!owner?.email) continue;

      await sendMail({
        to: owner.email,
        subject: `Weekly Summary: ${project.name}`,
        title: `Your Weekly Project Summary`,
        body: `
          <p>Hello ${owner.name || "Owner"},</p>
          <p>Here’s your summary for <strong>${project.name}</strong> (${monday.toDateString()} - ${sunday.toDateString()}):</p>
          <ul>${summaryList}</ul>
          <p>Total Tasks This Week: ${total}</p>
          <h4>Highlights:</h4>
          <ul>${taskList}</ul>
          <p>– Task Manager System</p>
        `,
      });
    }

    console.log("Weekly summary emails sent successfully.");
  } catch (error) {
    console.error("Error in Weekly Summary Job:", error);
  }
});
