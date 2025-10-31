import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
import { authenticate } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";

const router = express.Router();

router.use(authenticate)

router.post("/", authorize("admin"), createTask);
router.get("/", authorize("admin", "user"), getAllTasks);
router.get("/:id", authorize("admin", "user"), getTaskById);
router.put("/:id", authorize("admin", "user"), updateTask);
router.delete("/:id", authorize("admin"), deleteTask);

export default router;
