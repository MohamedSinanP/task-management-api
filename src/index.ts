import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRouter from "./routes/auth";
import projectRouter from "./routes/project";
import taskRouter from "./routes/task";
import adminRouter from './routes/admin';
import notificationRouter from './routes/notification';

import connectDb from "./config/db";
import { seedAdmin } from "./config/seedAdmin";
import { initSocket } from "./socket";
import "./cron/index";

const app = express();
const server = http.createServer(app);

// Connect DB and seed admin
connectDb().then(() => {
  seedAdmin();
});

app.use(cors({
  origin: process.env.CLIENT_URL, credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Socket.IO
initSocket(server);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/project", projectRouter);
app.use("/api/task", taskRouter);
app.use("/api/admin", adminRouter);
app.use("/api/notifications", notificationRouter);

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
