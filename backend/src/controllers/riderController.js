import * as riderService from '../services/riderService.js';

const createRider = async (req, res, next) => {
    try {
        const data = await riderService.createRider(req.body);
        return res.status(201).json({ success: true, message: 'Rider created successfully', data });
    } catch (error) {
        return next(error);
    }
};

const updateRiderLocation = async (req, res, next) => {
    try {
        const data = await riderService.updateRiderLocation(req.params.riderId, req.body);
        return res.status(200).json({ success: true, message: 'Location updated', data });
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

export {
    createRider,
    updateRiderLocation,
    updateRider,
};