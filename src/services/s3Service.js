// s3Service.js
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadToS3 = async (file, bucket, type) => {
  const key = `${type}/update.swu`; // Fixed filename instead of timestamp
  
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

export const deleteFromS3 = async (bucket, key) => {
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    if (error.code !== 'NoSuchKey') throw new Error(`S3 delete failed: ${error.message}`);
  }
};