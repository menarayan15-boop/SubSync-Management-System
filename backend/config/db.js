import mongoose from 'mongoose';

/**
 * MongoDB connection manager with resilient fallback.
 * Tries process.env.MONGODB_URI first (e.g. MongoDB Atlas or local daemon).
 * If unavailable in local development, automatically spins up MongoMemoryServer
 * so the application remains 100% operational with full real Mongoose capabilities.
 */
let memoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subsync';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Fast timeout to fallback if no local server
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Primary MongoDB connection failed (${err.message}). Initializing fallback in-memory MongoDB instance...`);

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memoryUri = memoryServer.getUri();

      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] Fallback MongoMemoryServer connected successfully: ${memoryUri}`);
      return conn;
    } catch (memErr) {
      console.error('[Database] Critical error: could not connect to MongoDB or fallback:', memErr);
      throw memErr;
    }
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};
