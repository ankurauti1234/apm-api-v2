import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadToS3 = async (file, bucket, type) => {
  const key = `${type}/${Date.now()}-${file.originalname}`;
  
  const params = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const data = await s3.upload(params).promise();
    return { key, url: data.Location };
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

// Health check function that runs every 5 seconds
// const checkS3Health = async () => {
//   try {
//     await s3.headBucket({ Bucket: process.env.AUDIO_BUCKET }).promise();
//     await s3.headBucket({ Bucket: process.env.IMAGE_BUCKET }).promise();
//     logger.log('S3 buckets are healthy');
//   } catch (error) {
//     console.error('S3 health check failed:', error);
//   }
// };

// setInterval(checkS3Health, 5000);