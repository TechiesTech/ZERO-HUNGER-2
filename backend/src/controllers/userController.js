import * as userService from '../services/userService.js';

const findById = async (req, res, next) => {
    try {
        const user = await userService.findById(req.params.id);
        return res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        return next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body);
        return res.status(201).json({ success: true, data: { user } });
    } catch (error) {
        return next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        await userService.deleteUser(req.params.id);
        return res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        return next(error);
    }
};

const setStatus = async (req, res, next) => {
    try {
        const user = await userService.setStatus(req.params.id, req.body);
        return res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        return next(error);
    }
};

const setPassword = async (req, res, next) => {
    try {
        await userService.setPassword(req.params.id, req.body);
        return res.status(200).json({ success: true, message: 'Password updated. The user was logged out everywhere' });
    } catch (error) {
        return next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const user = await userService.updateProfile(req.user._id, req.body);
        return res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        return next(error);
    }
};

export { findById, createUser, deleteUser, setStatus, setPassword, updateProfile };