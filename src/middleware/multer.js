import multer from 'multer';
import logger from "../utils/logger.js";
const storage = multer.memoryStorage();

const audioFilter = (req, file, cb) => {
  logger.log('Audio file details:', {
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  const validAudioTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/x-wav',
    'audio/aac'
  ];
  
  if (validAudioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid audio format. Got ${file.mimetype}. Expected one of: ${validAudioTypes.join(', ')}`), false);
  }
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload an image file'), false);
  }
};

export const uploadAudio = multer({
  storage,
  fileFilter: audioFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});