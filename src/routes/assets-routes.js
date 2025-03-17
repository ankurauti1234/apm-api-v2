// routes/assets-routes.js
import express from 'express';
import AssetsController from '../controllers/assets-controller.js';
import multer from 'multer';

const router = express.Router();

const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'text/csv') {
            return cb(new Error('Only CSV files are allowed'));
        }
        cb(null, true);
    }
});

router.post('/upload-csv', upload.single('csvFile'), AssetsController.uploadCSV);

export default router;