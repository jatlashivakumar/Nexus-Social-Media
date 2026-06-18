import Redis from 'ioredis';
import logger from '../utils/logger.js';

let client = null;

export const connectRedis = async () => {
  try {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3, lazyConnect: true,
      retryStrategy: () => null, 
    });
    await client.connect();
    client.on('connect',     () => logger.info('✅ Redis connected'));
    client.on('error',  (e) => logger.error(`Redis: ${e.message}`));
  } catch (e) {
    logger.warn('Redis unavailable — caching disabled');
    client = null;
  }
};

export const getRedis  = () => client;

export const setCache = async (key, val, ttl = 3600) => {
  if (!client) return null;
  try { return await client.setex(key, ttl, JSON.stringify(val)); } catch { return null; }
};

export const getCache = async (key) => {
  if (!client) return null;
  try { const d = await client.get(key); return d ? JSON.parse(d) : null; } catch { return null; }
};

export const deleteCache = async (key) => {
  if (!client) return null;
  try { return await client.del(key); } catch { return null; }
};

export const deleteCachePattern = async (pattern) => {
  if (!client) return null;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(...keys);
    return keys.length;
  } catch { return null; }
};
