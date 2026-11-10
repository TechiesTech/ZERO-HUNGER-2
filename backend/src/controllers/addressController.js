import * as addressService from '../services/addressService.js';

const getMyAddresses = async (req, res, next) => {
    try {
        const data = await addressService.getMyAddresses(req.user);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const createAddress = async (req, res, next) => {
    try {
        const data = await addressService.createAddress(req.user, req.body);
        return res.status(201).json({ success: true, message: 'Address saved successfully', data });
    } catch (error) {
        return next(error);
    }
};

const updateAddress = async (req, res, next) => {
    try {
        const data = await addressService.updateAddress(req.user, req.params.addressId, req.body);
        return res.status(200).json({ success: true, message: 'Address updated successfully', data });
    } catch (error) {
        return next(error);
    }
};

const setDefaultAddress = async (req, res, next) => {
    try {
        const data = await addressService.setDefaultAddress(req.user, req.params.addressId);
        return res.status(200).json({ success: true, message: 'Default address updated successfully', data });
    } catch (error) {
        return next(error);
    }
};

const deleteAddress = async (req, res, next) => {
    try {
        const data = await addressService.deleteAddress(req.user, req.params.addressId);
        return res.status(200).json({ success: true, message: 'Address deleted successfully', data });
    } catch (error) {
        return next(error);
    }
};

export { getMyAddresses, createAddress, updateAddress, setDefaultAddress, deleteAddress };