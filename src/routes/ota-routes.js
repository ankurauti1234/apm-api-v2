import express from 'express';
import {
  uploadFullUpdate,
  uploadDeltaSwu,
  uploadDeltaZck,
  getHistory,
  upload,
} from '../controllers/ota-controller.js';
import { authenticate, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and password check to all routes
router.use(authenticate);

// POST routes restricted to admin and developer
router.post('/upload/full', restrictTo('admin', 'developer'), upload.single('file'), uploadFullUpdate);
router.post('/upload/delta/swu', restrictTo('admin', 'developer'), upload.single('file'), uploadDeltaSwu);
router.post('/upload/delta/zck', restrictTo('admin', 'developer'), upload.single('file'), uploadDeltaZck);

// GET route available to authenticated users
router.get('/history', getHistory);

export default router;