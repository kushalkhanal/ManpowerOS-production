import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import logger from '../config/logger.js';

const JWT_SECRET = config.jwtSecret;

const connectedUsers = new Map();

export const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, agencyId, role, name } = socket.user;
    const userIdStr = userId?.toString() || userId;

    socket.join(`agency:${agencyId}`);
    socket.join(`user:${userIdStr}`);
    socket.join(`role:${agencyId}:${role}`);

    connectedUsers.set(userIdStr, {
      socketId: socket.id,
      agencyId,
      role,
      name
    });

    socket.to(`role:${agencyId}:admin`).emit('staff_online', {
      userId: userIdStr,
      name,
      role,
      timestamp: new Date()
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userIdStr);
      socket.to(`role:${agencyId}:admin`).emit('staff_offline', {
        userId: userIdStr,
        name,
        timestamp: new Date()
      });
    });

    socket.on('alert_read', async ({ alertId }) => {
      try {
        const { InternalAlert } = await import('../models/InternalAlert.js');
        if (InternalAlert) {
          await InternalAlert.findByIdAndUpdate(alertId, {
            $push: { readBy: { userId: userIdStr, readAt: new Date() } }
          });
        }
      } catch (error) {
        logger.error('Error updating alert read status:', error);
      }
    });

    socket.on('typing', ({ candidateId }) => {
      socket.to(`agency:${agencyId}`).emit('user_typing', {
        userId: userIdStr,
        name,
        candidateId
      });
    });
  });
};

export const emitToAgency = (io, agencyId, event, data) => {
  if (io) {
    io.to(`agency:${agencyId}`).emit(event, data);
  }
};

export const emitToUser = (io, userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, data);
  }
};

export const emitToRole = (io, agencyId, role, event, data) => {
  if (io && agencyId && role) {
    io.to(`role:${agencyId}:${role}`).emit(event, data);
  }
};

export const getOnlineStaff = (agencyId) => {
  return [...connectedUsers.entries()]
    .filter(([, v]) => v.agencyId?.toString() === agencyId?.toString())
    .map(([userId, v]) => ({
      userId,
      name: v.name,
      role: v.role,
      socketId: v.socketId
    }));
};

export const isUserOnline = (userId) => {
  return connectedUsers.has(userId?.toString());
};

export const getUserSocketId = (userId) => {
  const user = connectedUsers.get(userId?.toString());
  return user?.socketId;
};

export default {
  initSocket,
  emitToAgency,
  emitToUser,
  emitToRole,
  getOnlineStaff,
  isUserOnline,
  getUserSocketId
};