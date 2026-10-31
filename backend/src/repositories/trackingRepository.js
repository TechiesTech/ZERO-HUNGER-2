import { Delivery } from '../models/schemas/deliverySchema.js';
import AppError from '../utils/appError.js';

const createLocationUpdate = async (data) => {
  const tracking = await Delivery.findOne({ orderId: data.orderId });
  if (!tracking) {
    const newTracking = await Delivery.create({
      orderId: data.orderId,
      deliveryPartnerId: data.deliveryPartnerId,
      currentLocation: {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
      },
      locationHistory: [{
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
      }],
      status: 'assigned',
    });
    return newTracking;
  }

  tracking.currentLocation = {
    latitude: data.latitude,
    longitude: data.longitude,
    timestamp: data.timestamp,
  };

  tracking.locationHistory.push({
    latitude: data.latitude,
    longitude: data.longitude,
    timestamp: data.timestamp,
  });

  tracking.lastLocationUpdate = new Date();
  await tracking.save();
  return tracking;
};

const getTrackingByOrderId = async (orderId) => {
  return Delivery.findOne({ orderId });
};

const getLatestLocation = async (orderId) => {
  const tracking = await Delivery.findOne({ orderId });
  if (!tracking) return null;
  return tracking.currentLocation;
};

const updateDeliveryStatus = async (orderId, status) => {
  const tracking = await Delivery.findOne({ orderId });
  if (!tracking) {
    throw new AppError('Tracking not found', 404);
  }
  tracking.status = status;
  if (status === 'delivered') {
    tracking.deliveredAt = new Date();
  }
  await tracking.save();
  return tracking;
};

const assignDeliveryPartner = async (orderId, deliveryPartnerId) => {
  const tracking = await Delivery.findOne({ orderId });
  if (!tracking) {
    const newTracking = await Delivery.create({
      orderId,
      deliveryPartnerId,
      status: 'assigned',
      currentLocation: null,
      locationHistory: [],
    });
    return newTracking;
  }
  tracking.deliveryPartnerId = deliveryPartnerId;
  tracking.status = 'assigned';
  await tracking.save();
  return tracking;
};

export {
  createLocationUpdate,
  getTrackingByOrderId,
  getLatestLocation,
  updateDeliveryStatus,
  assignDeliveryPartner,
};
