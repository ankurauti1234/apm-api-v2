import express from 'express';
import { startSurvey, updateHousehold, updateMember, getHousehold } from '../controllers/household-controller.js';

const router = express.Router();

router.post('/start', startSurvey);
router.put('/household/:hhid', updateHousehold);
router.put('/household/:hhid/member/:mmid', updateMember);
router.get('/household/:hhid', getHousehold);

export default router;