import { Router } from 'express';
import {
  getTrackingData,
  updateLocation,
  updateStatus,
  assignPartner,
} from '../controllers/trackingController.js';
import { orderIdParamSchema } from '../validators/orderValidator.js';
import validate from '../middleware/validate.js';

const router = Router();

router.get('/:orderId', validate(orderIdParamSchema, 'params'), getTrackingData);
router.post('/:orderId/location', validate(orderIdParamSchema, 'params'), updateLocation);
router.patch('/:orderId/status', validate(orderIdParamSchema, 'params'), updateStatus);
router.post('/:orderId/assign', validate(orderIdParamSchema, 'params'), assignPartner);

export { router as trackingRouter };
