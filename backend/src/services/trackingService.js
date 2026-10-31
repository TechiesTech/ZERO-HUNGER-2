import * as trackingRepository from '../repositories/trackingRepository.js';
import AppError from '../utils/appError.js';

const createLocationUpdate = async (data) => {
  const { orderId, deliveryPartnerId, latitude, longitude, timestamp } = data;

  if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new AppError('Invalid coordinates', 400);
  }

  return trackingRepository.createLocationUpdate({
    orderId,
    deliveryPartnerId,
    latitude,
    longitude,
    timestamp: timestamp || new Date().toISOString(),
  });
};

const getTrackingData = async (orderId) => {
  const tracking = await trackingRepository.getTrackingByOrderId(orderId);
  if (!tracking) {
    throw new AppError('Tracking data not found', 404);
  }
  return tracking;
};

const getLatestLocation = async (orderId) => {
  return trackingRepository.getLatestLocation(orderId);
};

const updateDeliveryStatus = async (orderId, status) => {
  return trackingRepository.updateDeliveryStatus(orderId, status);
};

const assignDeliveryPartner = async (orderId, deliveryPartnerId) => {
  return trackingRepository.assignDeliveryPartner(orderId, deliveryPartnerId);
};

export {
  createLocationUpdate,
  getTrackingData,
  getLatestLocation,
  updateDeliveryStatus,
  assignDeliveryPartner,
};
