import mongoose from "mongoose";


const mongoUrl = process.env.MONGO_URI as string;
const connectDb = async () => {
  try {
    if (!mongoUrl) throw new Error("MONGO_URI not defined in .env");
    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDb;
