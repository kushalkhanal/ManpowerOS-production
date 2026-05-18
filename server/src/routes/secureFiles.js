import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { resolveDocument, moderationWebhook } from '../controllers/secureFilesController.js';
import { signUpload } from '../controllers/uploadSignatureController.js';

const router = express.Router();

// Cloudinary moderation webhook is signature-verified, NOT auth-gated.
// Mount it before the authenticate middleware.
router.post('/moderation-webhook', moderationWebhook);

router.use(authenticate);
router.get('/resolve', resolveDocument);
router.post('/sign-upload', signUpload);

export default router;
