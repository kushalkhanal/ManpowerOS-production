import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  subdomain: Joi.string().trim().allow(null, '').optional(),
  rememberMe: Joi.boolean().optional()
});

export const registerAgencySchema = Joi.object({
  agencyName: Joi.string().trim().min(2).max(100).required(),
  subdomain: Joi.string().trim().alphanum().min(2).max(50).optional(),
  adminName: Joi.string().trim().min(2).max(100).required(),
  adminEmail: Joi.string().email().required(),
  adminPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
    })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
    })
});

export const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().trim().min(2).max(100).required(),
  role: Joi.string().valid('admin', 'manager', 'documentation', 'accounts', 'agent').required()
});