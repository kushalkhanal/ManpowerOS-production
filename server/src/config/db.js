import mongoose from 'mongoose';
import logger from './logger.js';
import { config } from './env.js';

const connectDB = async () => {
  try {
    const MONGODB_URI = config.mongodbUri;
    
    const options = {
      maxPoolSize: config.isProduction ? 10 : 5,
      minPoolSize: config.isProduction ? 2 : 1,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    };
    
    const conn = await mongoose.connect(MONGODB_URI, options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;