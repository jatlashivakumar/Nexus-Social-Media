import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  });
  logger.info(`✅ MongoDB: ${conn.connection.host}`);
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected',  () => logger.info('MongoDB reconnected'));
};
