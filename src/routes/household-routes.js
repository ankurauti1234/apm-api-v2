// routes/householdRoutes.js
import express from 'express';
import { 
    startSurvey,
    updateHousehold,
    updateMember,
    getHousehold,
    createMeter,
    getAvailableMeters,
    bulkAddMeters,
    bulkDeleteMeters
} from '../controllers/household-controller.js';

const router = express.Router();

router.post('/start', startSurvey);
router.put('/update/:HHID', updateHousehold);
router.put('/member/:HHID/:mmid', updateMember);
router.get('/:HHID', getHousehold);
router.post('/meter/create', createMeter);
router.get('/meters/available', getAvailableMeters);
router.post('/meters/bulk-add', bulkAddMeters);
router.delete('/meters/bulk-delete', bulkDeleteMeters);

export default router;