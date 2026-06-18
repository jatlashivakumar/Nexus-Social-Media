import { createServer } from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './socket/socket.js';
import logger from './utils/logger.js';
import 'dotenv/config';

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    await connectRedis();

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () =>
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`)
    );

    const shutdown = (sig) => {
      logger.info(`${sig} — shutting down`);
      httpServer.close(() => process.exit(0));
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled rejection:', err);
      httpServer.close(() => process.exit(1));
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err);
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start:', err);
    process.exit(1);
  }
};

start();
