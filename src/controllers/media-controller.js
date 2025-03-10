import { uploadToS3 } from '../services/s3Service.js';
import Media from '../models/Media.js';

export const uploadAudioController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    const timestamp = new Date();

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
      deviceId,
      timestamp,
    });

    await media.save();

    res.status(201).json({
      message: 'Audio uploaded successfully',
      url,
      mediaId: media._id,
      timestamp,
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
};

export const uploadImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    const timestamp = new Date();

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
      deviceId,
      timestamp,
    });

    await media.save();

    res.status(201).json({
      message: 'Image uploaded successfully',
      url,
      mediaId: media._id,
      timestamp,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};