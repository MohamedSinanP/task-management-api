// src/socket.ts
import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log("Socket.IO initialized");

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join user notification room
    socket.on("joinUser", (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${socket.id} joined user:${userId}`);
    });

    // Join specific task room
    socket.on("joinTask", (taskId) => {
      socket.join(`task:${taskId}`);
      console.log(`User ${socket.id} joined task:${taskId}`);
    });

    // Leave specific task room
    socket.on("leaveTask", (taskId) => {
      socket.leave(`task:${taskId}`);
      console.log(`User ${socket.id} left task:${taskId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

// Helper function to send notifications
export const sendNotification = (userId: string, notification: any) => {
  const io = getIO();
  io.to(`user:${userId}`).emit("newNotification", notification);
};

// Helper function to send notification to admin
export const sendAdminNotification = (notification: any) => {
  const io = getIO();
  io.emit("adminNotification", notification);
};