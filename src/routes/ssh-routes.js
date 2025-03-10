import express from 'express';
import { listMeters } from '../controllers/ssh-controller.js';
import { authenticate, restrictTo, checkPasswordChange } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get('/meters', listMeters);

export default router;