import { Router } from 'express';
import { createRider, updateRider, updateRiderLocation, getAllRiders, getRiderById, deleteRider } from '../controllers/riderController.js';
import {
    createRiderSchema,
    riderIdParamSchema,
    updateRiderLocationSchema,
    updateRiderSchema,
    getAllRidersSchema,
} from '../validators/riderValidator.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post('/createRider', validate(createRiderSchema), createRider);
router.patch('/updateRider/:riderId', validate(riderIdParamSchema, 'params'), validate(updateRiderSchema), updateRider);
router.patch('/updateRiderLocation/:riderId', validate(riderIdParamSchema, 'params'), validate(updateRiderLocationSchema), updateRiderLocation);
router.get('/getAllRiders', validate(getAllRidersSchema, 'query'), getAllRiders);
router.get('/getRiderById/:riderId', validate(riderIdParamSchema, 'params'), getRiderById);
router.delete('/deleteRider/:riderId', validate(riderIdParamSchema, 'params'), deleteRider);

export default router;