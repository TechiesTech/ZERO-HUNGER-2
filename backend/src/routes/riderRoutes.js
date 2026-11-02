import { Router } from 'express';
import { createRider, updateRider, updateRiderLocation } from '../controllers/riderController.js';
import {
    createRiderSchema,
    riderIdParamSchema,
    updateRiderLocationSchema,
    updateRiderSchema,
} from '../validators/riderValidator.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post('/createRider', validate(createRiderSchema), createRider);
router.patch('/updateRider/:riderId', validate(riderIdParamSchema, 'params'), validate(updateRiderSchema), updateRider);
router.patch('/updateRiderLocation/:riderId', validate(riderIdParamSchema, 'params'), validate(updateRiderLocationSchema), updateRiderLocation);

export default router;