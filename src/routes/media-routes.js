import express from 'express';
import { uploadAudio, uploadImage } from '../middleware/multer.js';
import { uploadToS3 } from '../services/s3Service.js';
import Media from '../models/Media.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting: max 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Upload Audio API
router.post('/audio', limiter, uploadAudio.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const { key, url } = await uploadToS3(
      req.file,
      process.env.AUDIO_BUCKET,
      'audio'
    );

    const media = new Media({
      type: 'audio',
      s3Key: key,
      bucket: process.env.AUDIO_BUCKET,
      originalName: req.file.originalname,
      size: req.file.size,
    });

    await media.save();

    res.status(201).json({
      message: 'Audio uploaded successfully',
      url,
      mediaId: media._id,
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// Upload Image API
router.post('/image', limiter, uploadImage.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { key, url } = await uploadToS3(
      req.file,
      process.env.IMAGE_BUCKET,
      'image'
    );

    const media = new Media({
      type: 'image',
      s3Key: key,
      bucket: process.env.IMAGE_BUCKET,
      originalName: req.file.originalname,
      size: req.file.size,
    });

    await media.save();

    res.status(201).json({
      message: 'Image uploaded successfully',
      url,
      mediaId: media._id,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;