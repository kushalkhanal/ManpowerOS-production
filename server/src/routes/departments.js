import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/checkPermission.js';
import Department from '../models/Department.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as apiResponse from '../utils/apiResponse.js';
import { validateZod } from '../validators/validateZod.js';
import { departmentSchema, departmentUpdateSchema } from '../validators/zod/department.schema.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'manager', 'documentation', 'accounts', 'agent'), asyncHandler(async (req, res) => {
  const departments = await Department.find({ agencyId: req.user.agencyId })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return apiResponse.success(res, departments);
}));

router.post('/', requireRole('admin', 'manager'), validateZod(departmentSchema), asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;
  
  if (!name) {
    return apiResponse.error(res, 'Department name is required', 400);
  }

  const existing = await Department.findOne({ agencyId: req.user.agencyId, name });
  if (existing) {
    return apiResponse.error(res, 'Department with this name already exists', 400);
  }

  const maxOrder = await Department.findOne({ agencyId: req.user.agencyId })
    .sort({ order: -1 })
    .select('order')
    .lean();
  
  const department = await Department.create({
    agencyId: req.user.agencyId,
    name,
    description,
    color: color || '#6366f1',
    order: maxOrder ? maxOrder.order + 1 : 0
  });

  return apiResponse.created(res, department, 'Department created successfully');
}));

router.patch('/:id', requireRole('admin', 'manager'), validateZod(departmentUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, color, isActive, order } = req.body;

  const department = await Department.findOne({ _id: id, agencyId: req.user.agencyId });
  if (!department) {
    return apiResponse.notFound(res, 'Department not found');
  }

  if (name && name !== department.name) {
    const existing = await Department.findOne({ agencyId: req.user.agencyId, name, _id: { $ne: id } });
    if (existing) {
      return apiResponse.error(res, 'Department with this name already exists', 400);
    }
    department.name = name;
  }

  if (description !== undefined) department.description = description;
  if (color) department.color = color;
  if (isActive !== undefined) department.isActive = isActive;
  if (order !== undefined) department.order = order;

  await department.save();
  return apiResponse.success(res, department, 'Department updated successfully');
}));

router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findOne({ _id: id, agencyId: req.user.agencyId });
  if (!department) {
    return apiResponse.notFound(res, 'Department not found');
  }

  await Department.findByIdAndDelete(id);
  return apiResponse.success(res, null, 'Department deleted successfully');
}));

export default router;