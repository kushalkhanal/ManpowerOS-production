import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { initSocket, getOnlineStaff } from './src/socket/socketManager.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  console.log('✅ MONGODB_URI environment variable detected.');
} else {
  console.log('❌ MONGODB_URI is MISSING. Falling back to localhost...');
}

const finalMongoUri = MONGODB_URI || 'mongodb://localhost:27017/manpoweros';

const expressApp = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

console.log(`🔧 CORS origins: ${process.env.CORS_ORIGINS?.split(',') || process.env.CLIENT_URL || 'http://localhost:5173'}`);

initSocket(io);
app.set('io', io);

app.get('/api/staff/online', (req, res) => {
  const agencyId = req.user?.agencyId;
  if (!agencyId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const onlineStaff = getOnlineStaff(agencyId);
  res.json(onlineStaff);
});

mongoose.connect(finalMongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });