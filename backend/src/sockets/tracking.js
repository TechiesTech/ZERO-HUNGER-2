import { Server } from 'socket.io';
import * as trackingService from '../services/trackingService.js';

const trackingRooms = new Map();

export function initTracking(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('client:join', ({ orderId }) => {
      const room = `order:${orderId}`;
      socket.join(room);
      trackingRooms.set(socket.id, room);
      console.log(`Client ${socket.id} joined room ${room}`);
    });

    socket.on('rider:location', async (data) => {
      try {
        const { orderId, deliveryPartnerId, latitude, longitude, timestamp } = data;
        
        await trackingService.createLocationUpdate({
          orderId,
          deliveryPartnerId,
          latitude,
          longitude,
          timestamp,
        });

        const room = `order:${orderId}`;
        io.to(room).emit('delivery:location', {
          orderId,
          deliveryPartnerId,
          latitude,
          longitude,
          timestamp,
        });
      } catch (error) {
        console.error('Error updating rider location:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('delivery:status', async (data) => {
      try {
        const { orderId, status } = data;
        
        await trackingService.updateDeliveryStatus(orderId, status);

        const room = `order:${orderId}`;
        io.to(room).emit('delivery:update', {
          orderId,
          status,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating delivery status:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      const room = trackingRooms.get(socket.id);
      if (room) {
        socket.leave(room);
        trackingRooms.delete(socket.id);
        console.log(`Client ${socket.id} left room ${room}`);
      }
    });
  });

  return io;
}
