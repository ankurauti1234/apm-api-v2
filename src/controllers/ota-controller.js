import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import Version from '../models/OTAVersion.js';
import { uploadToS3, deleteFromS3 } from '../services/s3Service.js';
import logger from "../utils/logger.js";

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.swu' && ext !== '.zck') {
      return cb(new Error('Only .swu and .zck files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
});

// Constants
const S3_BUCKET = process.env.OTA_BUCKET;
const OTA_SERVER_URL = process.env.OTA_SERVER_URL;
const S3_SWU_KEY = 'full/update.swu';
const OTA_ZCK_FILENAME = 'output.zck';

// Helper function to get next version
const getNextVersion = async (customVersion) => {
  if (customVersion) {
    const versionParts = customVersion.split('.');
    if (versionParts.length !== 3 || versionParts.some(part => isNaN(parseInt(part)))) {
      throw new Error('Invalid version format. Use x.x.x format');
    }
    return customVersion;
  }

  try {
    const lastVersion = await Version.findOne().sort({ uploadDate: -1 });
    if (!lastVersion) return '0.0.1';

    const versionParts = lastVersion.version.split('.');
    if (versionParts.length !== 3) {
      throw new Error('Invalid version format in database');
    }

    const [major, minor, patch] = versionParts.map(part => {
      const num = parseInt(part, 10);
      if (isNaN(num)) {
        throw new Error(`Invalid version part: ${part}`);
      }
      return num;
    });

    return `${major}.${minor}.${patch + 1}`;
  } catch (error) {
    logger.error('Error in getNextVersion:', error.message);
    return '0.0.1';
  }
};

// Full Update: Upload update.swu to S3
export const uploadFullUpdate = async (req, res) => {
  try {
    if (!req.file || path.extname(req.file.originalname).toLowerCase() !== '.swu') {
      return res.status(400).json({ status: 'error', message: 'Please upload an .swu file' });
    }

    const customVersion = req.body.version;
    const filePath = path.resolve(req.file.path);
    const fileBuffer = await fs.promises.readFile(filePath);

    // Delete existing update.swu if it exists
    await deleteFromS3(S3_BUCKET, S3_SWU_KEY);

    const { url } = await uploadToS3(
      { buffer: fileBuffer, originalname: 'update.swu', mimetype: 'application/octet-stream' },
      S3_BUCKET,
      'full'
    );

    await fs.promises.unlink(filePath);

    const newVersionNumber = await getNextVersion(customVersion);
    const newVersion = new Version({
      filename: 'update.swu',
      version: newVersionNumber,
      url,
      type: 'full',
      performedBy: req.user._id  // Add user who performed the upload
    });
    await newVersion.save();

    res.status(200).json({
      status: 'success',
      message: 'Full update uploaded successfully',
      url,
      version: newVersionNumber,
    });
  } catch (error) {
    logger.error('Full Update Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Full update failed',
      error: error.message,
    });
  }
};

// Delta Update: Upload update.swu to S3
export const uploadDeltaSwu = async (req, res) => {
  try {
    if (!req.file || path.extname(req.file.originalname).toLowerCase() !== '.swu') {
      return res.status(400).json({ status: 'error', message: 'Please upload an .swu file' });
    }

    const filePath = path.resolve(req.file.path);
    const fileBuffer = await fs.promises.readFile(filePath);

    // Delete existing update.swu if it exists
    await deleteFromS3(S3_BUCKET, S3_SWU_KEY);

    const { url } = await uploadToS3(
      { buffer: fileBuffer, originalname: 'update.swu', mimetype: 'application/octet-stream' },
      S3_BUCKET,
      'full'
    );

    await fs.promises.unlink(filePath);

    res.status(200).json({
      status: 'success',
      message: 'Delta SWU uploaded to S3 successfully',
      url,
    });
  } catch (error) {
    logger.error('Delta SWU Upload Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Delta SWU upload failed',
      error: error.message,
    });
  }
};

// Delta Update: Upload output.zck to OTA server (streaming)
export const uploadDeltaZck = async (req, res) => {
  try {
    if (!req.file || path.extname(req.file.originalname).toLowerCase() !== '.zck') {
      return res.status(400).json({ status: 'error', message: 'Please upload a .zck file' });
    }

    const customVersion = req.body.version;
    const filePath = path.resolve(req.file.path);
    const targetUrl = `${OTA_SERVER_URL}${OTA_ZCK_FILENAME}`;
    const fileStream = fs.createReadStream(filePath);

    try {
      await axios.delete(targetUrl);
    } catch (error) {
      if (error.response?.status !== 404) throw error;
    }

    await axios.put(targetUrl, fileStream, {
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': req.file.size },
    });

    await fs.promises.unlink(filePath);

    const swuUrl = req.body.swuUrl;
    const newVersionNumber = await getNextVersion(customVersion);
    const newVersion = new Version({
      filename: 'update.swu',
      version: newVersionNumber,
      url: swuUrl,
      type: 'delta',
      deltaUrl: targetUrl,
      performedBy: req.user._id  // Add user who performed the upload
    });
    await newVersion.save();

    res.status(200).json({
      status: 'success',
      message: 'Delta ZCK uploaded successfully',
      url: swuUrl,
      deltaUrl: targetUrl,
      version: newVersionNumber,
    });
  } catch (error) {
    logger.error('Delta ZCK Upload Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Delta ZCK upload failed',
      error: error.message,
    });
  }
};

// Get OTA version history
export const getHistory = async (req, res) => {
  try {
    const history = await Version.find()
      .populate('performedBy', 'firstname lastname email')  // Populate user details
      .sort({ uploadDate: -1 });
    res.status(200).json({ status: 'success', data: history });
  } catch (error) {
    logger.error('History Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch history',
      error: error.message,
    });
  }
};

export { upload };