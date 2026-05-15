import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as agencyDocumentController from '../controllers/agencyDocumentController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { validateZod } from '../validators/validateZod.js';
import { agencyDocumentSchema, agencyDocumentUpdateSchema } from '../validators/zod/agencyDocument.schema.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = /pdf|docx?|xlsx?|jpg|jpeg|png|gif|webp/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  if (extname) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter 
});

router.use(authenticate);

router.post('/', upload.single('file'), validateZod(agencyDocumentSchema), agencyDocumentController.createDocument);
router.get('/', agencyDocumentController.getDocuments);
router.get('/expiring', agencyDocumentController.getExpiringDocuments);
router.get('/:id', agencyDocumentController.getDocumentById);
router.get('/:id/download', agencyDocumentController.downloadDocument);
router.patch('/:id', validateZod(agencyDocumentUpdateSchema), agencyDocumentController.updateDocument);
router.delete('/:id', authorize('admin', 'superadmin'), agencyDocumentController.deleteDocument);

export default router;