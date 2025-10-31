import bcrypt from "bcryptjs";
import { User } from "../models/userModel";

export const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL!;
    const adminPassword = process.env.ADMIN_PASSWORD!;

    const existingAdmin = await User.findOne({ email: adminEmail, role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = new User({
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("Default admin created successfully!");
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
};
