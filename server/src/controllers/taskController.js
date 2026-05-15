import Task from '../models/Task.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';
import { emitToUser, emitToRole } from '../socket/socketManager.js';
import logger from '../config/logger.js';

const getTasks = asyncHandler(async (req, res) => {
  const { status, assignedTo, priority, taskType, dueDate, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { agencyId: req.user.agencyId };
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (priority) filter.priority = priority;
  if (taskType) filter.taskType = taskType;
  if (dueDate) {
    const date = new Date(dueDate);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.dueDate = { $gte: date, $lt: nextDay };
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('candidateId', 'fullName phone status')
      .populate('demandId', 'companyName country')
      .sort({ priority: -1, dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Task.countDocuments(filter)
  ]);

  res.status(200).json({
    data: tasks,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  })
    .populate('assignedTo', 'name email role phone')
    .populate('assignedBy', 'name email role')
    .populate('candidateId', 'fullName phone status desiredCountry passportNo')
    .populate('demandId', 'companyName country employerName')
    .populate('completedBy', 'name email');

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.status(200).json(task);
});

const getMyTasks = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const filter = { 
    agencyId: req.user.agencyId,
    assignedTo: req.user.userId 
  };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate('assignedBy', 'name')
    .populate('candidateId', 'fullName')
    .populate('demandId', 'companyName')
    .sort({ priority: -1, dueDate: 1, createdAt: -1 })
    .lean();

  res.status(200).json(tasks);
});

const getTasksByCandidate = asyncHandler(async (req, res) => {
  const tasks = await Task.find({
    agencyId: req.user.agencyId,
    candidateId: req.params.candidateId
  })
    .populate('assignedTo', 'name')
    .populate('assignedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(tasks);
});

const createTask = asyncHandler(async (req, res) => {
  const {
    title, description, taskType, assignedTo,
    candidateId, demandId, dueDate, priority, notes
  } = req.body;

  const assignee = await User.findOne({
    _id: assignedTo,
    agencyId: req.user.agencyId
  });
  if (!assignee) {
    return res.status(400).json({ message: 'Assignee not found' });
  }

  const task = await Task.create({
    agencyId: req.user.agencyId,
    title,
    description,
    taskType,
    assignedTo,
    assignedBy: req.user.userId,
    candidateId,
    demandId,
    dueDate,
    priority: priority || 'medium',
    notes
  });

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');

  const io = req.app.get('io');
  if (io) {
    try {
      const { emitToUser, emitToRole } = await import('../socket/socketManager.js');
      emitToUser(io, assignedTo, 'task_assigned', {
        taskId: task._id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        assignedBy: populatedTask.assignedBy?.name,
        timestamp: new Date()
      });
      emitToRole(io, req.user.agencyId, 'manager', 'task_created', {
        taskId: task._id,
        title: task.title,
        assignedTo: populatedTask.assignedTo?.name,
        dueDate: task.dueDate
      });
    } catch (socketError) {
      logger.warn('Socket notification failed:', socketError.message);
    }
  }

  res.status(201).json(populatedTask);
});

const updateTask = asyncHandler(async (req, res) => {
  const {
    title, description, taskType, assignedTo,
    candidateId, demandId, dueDate, priority, notes
  } = req.body;

  const task = await Task.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const updates = { title, description, taskType, assignedTo, candidateId, demandId, dueDate, priority, notes };
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      task[key] = updates[key];
    }
  });

  await task.save();

  const updated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .populate('candidateId', 'fullName')
    .populate('demandId', 'companyName');

  res.status(200).json(updated);
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const task = await Task.findOne({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  task.status = status;
  if (notes !== undefined) task.notes = notes;

  if (status === 'completed') {
    task.completedAt = new Date();
    task.completedBy = req.user.userId;
  } else {
    task.completedAt = null;
    task.completedBy = null;
  }

  await task.save();

  const updated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .populate('completedBy', 'name email');

  res.status(200).json(updated);
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    agencyId: req.user.agencyId
  });

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.status(200).json({ message: 'Task deleted' });
});

const getTaskStats = asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const userId = req.user.userId;

  const [total, pending, inProgress, completed, myTasks] = await Promise.all([
    Task.countDocuments({ agencyId }),
    Task.countDocuments({ agencyId, status: 'pending' }),
    Task.countDocuments({ agencyId, status: 'in_progress' }),
    Task.countDocuments({ agencyId, status: 'completed' }),
    Task.countDocuments({ agencyId, assignedTo: userId, status: { $ne: 'completed' } })
  ]);

  const overdue = await Task.countDocuments({
    agencyId,
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });

  res.status(200).json({
    total,
    pending,
    inProgress,
    completed,
    overdue,
    myTasks
  });
});

export {
  getTasks,
  getTaskById,
  getMyTasks,
  getTasksByCandidate,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats
};