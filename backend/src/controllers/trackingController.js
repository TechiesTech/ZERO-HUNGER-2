import * as trackingService from '../services/trackingService.js';
import AppError from '../utils/appError.js';

const getTrackingData = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const tracking = await trackingService.getTrackingData(orderId);
    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    next(error);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { deliveryPartnerId, latitude, longitude, timestamp } = req.body;

    const tracking = await trackingService.createLocationUpdate({
      orderId,
      deliveryPartnerId,
      latitude,
      longitude,
      timestamp,
    });

    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const tracking = await trackingService.updateDeliveryStatus(orderId, status);
    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    next(error);
  }
};

const assignPartner = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { deliveryPartnerId } = req.body;

    const tracking = await trackingService.assignDeliveryPartner(orderId, deliveryPartnerId);
    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    next(error);
  }
};

export {
  getTrackingData,
  updateLocation,
  updateStatus,
  assignPartner,
};
