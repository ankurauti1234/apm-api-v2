import express from 'express';
import { uploadAudio, uploadImage } from '../middleware/multer.js';
import { uploadAudioController, uploadImageController } from '../controllers/media-controller.js';

const router = express.Router();

// Upload Audio API
router.post('/audio', uploadAudio.single('audio'), uploadAudioController);

// Upload Image API
router.post('/image', uploadImage.single('image'), uploadImageController);

export default router;