import * as riderService from '../services/riderService.js';

const createRider = async (req, res, next) => {
    try {
        const data = await riderService.createRider(req.body);
        return res.status(201).json({ success: true, message: 'Rider created successfully', data });
    } catch (error) {
        return next(error);
    }
};

const updateRider = async (req, res, next) => {
    try {
        const data = await riderService.updateRider(req.params.riderId, req.body);
        return res.status(200).json({ success: true, message: 'Rider updated successfully', data });
    } catch (error) {
        return next(error);
    }
};

const getAllRiders = async (req, res, next) => {
    try {
        const data = await riderService.getAllRiders(req.validatedQuery);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const getRiderById = async (req, res, next) => {
    try {
        const data = await riderService.getRiderById(req.params.riderId);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

const deleteRider = async (req, res, next) => {
    try {
        await riderService.deleteRider(req.params.riderId);
        return res.status(200).json({ success: true, message: 'Rider deleted successfully' });
    } catch (error) {
        return next(error);
    }
};
export {
    createRider,
    updateRider,
    getAllRiders,
    getRiderById,
    deleteRider,
};