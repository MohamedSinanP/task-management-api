import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import { getAllActivityLogs } from '../controllers/activeLogsController';
import { getAllUsers } from '../controllers/userController';

const router = express.Router();

router.use(authenticate)

router.get('/active-logs', authorize("admin"), getAllActivityLogs);
router.get('/users', authorize("admin", "user"), getAllUsers);


export default router;