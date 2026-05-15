import express from 'express';
import * as taskController from '../controllers/taskController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateZod } from '../validators/validateZod.js';
import { taskSchema, taskUpdateSchema, taskStatusUpdateSchema } from '../validators/zod/task.schema.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', taskController.getTaskStats);
router.get('/my', taskController.getMyTasks);
router.get('/candidate/:candidateId', taskController.getTasksByCandidate);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', validateZod(taskSchema), taskController.createTask);
router.patch('/:id', validateZod(taskUpdateSchema), taskController.updateTask);
router.patch('/:id/status', validateZod(taskStatusUpdateSchema), taskController.updateTaskStatus);
router.delete('/:id', taskController.deleteTask);

export default router;