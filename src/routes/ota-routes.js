import express from 'express';
import {
  uploadFullUpdate,
  uploadDeltaSwu,
  uploadDeltaZck,
  getHistory,
  upload,
} from '../controllers/ota-controller.js';

const router = express.Router();

router.post('/upload/full', upload.single('file'), uploadFullUpdate);
router.post('/upload/delta/swu', upload.single('file'), uploadDeltaSwu);
router.post('/upload/delta/zck', upload.single('file'), uploadDeltaZck);
router.get('/history', getHistory);

export default router;