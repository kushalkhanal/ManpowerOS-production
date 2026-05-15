import express from 'express';
import { validateZod } from '../validators/validateZod.js';
import { loginSchema, registerAgencySchema, changePasswordSchema, completeInviteSchema } from '../validators/zod/auth.schema.js';
import authController from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { loginRateLimiter, passwordChangeRateLimiter, sensitiveOperationRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/login', loginRateLimiter, validateZod(loginSchema), authController.login);
router.get('/verify-invite/:token', authController.verifyInviteToken);
router.post('/complete-invite', sensitiveOperationRateLimiter, validateZod(completeInviteSchema), authController.completeInvite);

// Forgot-password — not yet implemented (requires email provider setup).
// Returns 501 so the client shows a clear message rather than hanging.
router.post('/forgot-password', sensitiveOperationRateLimiter, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Password reset via email is not yet available. Contact your system administrator to reset your password.'
  });
});

// Self-service agency registration — no auth required, rate-limited.
// The controller (registerAgency) does not reference req.user, so it is safe to expose publicly.
router.post('/register-agency-public', sensitiveOperationRateLimiter, validateZod(registerAgencySchema), authController.registerAgency);

// Protected routes
router.use(authenticate);

// Super admin agency registration with rate limiting
router.post('/register-agency', sensitiveOperationRateLimiter, authorize('superadmin'), validateZod(registerAgencySchema), authController.registerAgency);

// User management routes
router.get('/me', authController.getMe);
router.post('/change-password', passwordChangeRateLimiter, validateZod(changePasswordSchema), authController.changePassword);

export default router;