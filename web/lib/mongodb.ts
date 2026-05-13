import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGO_MAX_POOL_SIZE = Number(process.env.MONGO_MAX_POOL_SIZE ?? "10");
const MONGO_MIN_POOL_SIZE = Number(process.env.MONGO_MIN_POOL_SIZE ?? "2");
const MONGO_MAX_IDLE_TIME_MS = Number(process.env.MONGO_MAX_IDLE_TIME_MS ?? "60000");
const MONGO_WAIT_QUEUE_TIMEOUT_MS = Number(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS ?? "5000");
const MONGO_SERVER_SELECTION_TIMEOUT_MS = Number(
  process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS ?? "10000"
);
const MONGO_SOCKET_TIMEOUT_MS = Number(process.env.MONGO_SOCKET_TIMEOUT_MS ?? "45000");
const MONGO_APP_NAME = process.env.MONGO_APP_NAME ?? "biaodanguanli-web";

if (!MONGODB_URI) {
  throw new Error("缺少 MONGODB_URI 环境变量");
}

const mongoUri: string = MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const globalCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.mongooseCache = globalCache;

export async function connectMongo() {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      maxPoolSize: Number.isFinite(MONGO_MAX_POOL_SIZE) ? MONGO_MAX_POOL_SIZE : 10,
      minPoolSize: Number.isFinite(MONGO_MIN_POOL_SIZE) ? MONGO_MIN_POOL_SIZE : 2,
      maxIdleTimeMS: Number.isFinite(MONGO_MAX_IDLE_TIME_MS) ? MONGO_MAX_IDLE_TIME_MS : 60000,
      waitQueueTimeoutMS: Number.isFinite(MONGO_WAIT_QUEUE_TIMEOUT_MS)
        ? MONGO_WAIT_QUEUE_TIMEOUT_MS
        : 5000,
      serverSelectionTimeoutMS: Number.isFinite(MONGO_SERVER_SELECTION_TIMEOUT_MS)
        ? MONGO_SERVER_SELECTION_TIMEOUT_MS
        : 10000,
      socketTimeoutMS: Number.isFinite(MONGO_SOCKET_TIMEOUT_MS) ? MONGO_SOCKET_TIMEOUT_MS : 45000,
      appName: MONGO_APP_NAME,
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
