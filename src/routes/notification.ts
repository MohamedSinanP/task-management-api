import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import {
  getUserNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notificationController";
import { authorize } from "../middleware/roleMiddleware";

const router = express.Router();

router.use(authenticate);

router.get("/", getUserNotifications);
router.get("/all", authorize("admin"), getAllNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.patch("/mark-all-read", markAllAsRead);
router.delete("/:id", deleteNotification);

export default router;