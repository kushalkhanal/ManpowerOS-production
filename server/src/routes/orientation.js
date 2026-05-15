import express from 'express';
import orientationController from '../controllers/orientationController.js';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { uploadOrientationCert } from '../middleware/upload.js';
import { validateZod } from '../validators/validateZod.js';
import { orientationSchema, orientationUpdateSchema } from '../validators/zod/medical_orientation.schema.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateZod(orientationSchema), orientationController.createOrientation);
router.get('/board',              orientationController.getOrientationBoard);
router.patch('/bulk-status',      orientationController.bulkUpdateOrientationStatus);
router.get('/upcoming',           orientationController.getUpcomingOrientations);
router.get('/missing-certificates', orientationController.getMissingCertificates);
router.get('/',                   orientationController.getOrientationsByCandidate);
router.patch('/:id', uploadOrientationCert.single('certificate'), validateZod(orientationUpdateSchema), orientationController.updateOrientation);
router.delete('/:id', authorize('admin', 'superadmin'), orientationController.deleteOrientation);

router.post('/:id/certificate', 
  uploadOrientationCert.single('certificate'), 
  orientationController.uploadCertificate
);

router.delete('/:id/certificate', 
  authorize('admin', 'manager'), 
  orientationController.deleteCertificate
);

router.post('/:id/attendance-sheet',
  uploadOrientationCert.single('attendanceSheet'),
  orientationController.uploadAttendanceSheet
);

router.delete('/:id/attendance-sheet',
  authorize('admin', 'manager'),
  orientationController.deleteAttendanceSheet
);

export default router;