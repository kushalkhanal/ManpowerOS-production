import express from 'express';
import mongoose from 'mongoose';
import { config } from '../config/env.js';

const router = express.Router();

/**
 * Health check endpoint
 * Returns server status and database connectivity
 */
router.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    database: {
      connected: mongoose.connection.readyState === 1,
      state: getDbState(mongoose.connection.readyState)
    }
  };

  try {
    // Optional: Test database connectivity
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      healthcheck.database.latency = 'ok';
    }

    const statusCode = healthcheck.database.connected ? 200 : 503;
    res.status(statusCode).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'error';
    healthcheck.database.error = error.message;
    res.status(503).json(healthcheck);
  }
});

/**
 * Ready check endpoint (for Kubernetes/Docker health probes)
 * Returns 200 only when fully ready to serve traffic
 */
router.get('/ready', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      ready: false,
      reason: 'Database not connected'
    });
  }

  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * Live check endpoint (for Kubernetes liveness probes)
 * Returns 200 if the process is alive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

function getDbState(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
}

export default router;
