import { Router } from 'express';
import {
    getMyAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from '../controllers/addressController.js';
import {
    createAddressSchema,
    updateAddressSchema,
    addressIdParamSchema,
} from '../validators/addressValidator.js';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';
import requireRoles from '../middleware/requireRoles.js';

const router = Router();

// Customer endpoints (login required, the customer is read from the login cookie)
router.get('/getMyAddresses', authenticate, requireRoles('customer'), getMyAddresses);
router.post('/createAddress', authenticate, requireRoles('customer'), validate(createAddressSchema), createAddress);
router.patch('/updateAddress/:addressId', authenticate, requireRoles('customer'), validate(addressIdParamSchema, 'params'), validate(updateAddressSchema), updateAddress);
router.patch('/setDefaultAddress/:addressId', authenticate, requireRoles('customer'), validate(addressIdParamSchema, 'params'), setDefaultAddress);
router.delete('/deleteAddress/:addressId', authenticate, requireRoles('customer'), validate(addressIdParamSchema, 'params'), deleteAddress);

export default router;