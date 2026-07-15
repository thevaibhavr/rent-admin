import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  // Cache the connection promise across hot reloads and serverless invocations
  global.mongooseConn ??= mongoose.connect(uri);
  return global.mongooseConn;
}
