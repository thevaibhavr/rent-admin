import type mongoose from 'mongoose';
import { setServers } from 'node:dns';

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (global.mongooseConn) {
    try {
      return await global.mongooseConn;
    } catch {
      // Do not keep a rejected connect promise — Atlas DNS/network blips must retry
      global.mongooseConn = undefined;
    }
  }

  // Atlas mongodb+srv lookups fail on some Windows DNS resolvers; match cloth-backend.
  const dnsServers = (process.env.MONGODB_DNS_SERVERS || (uri.includes('mongodb+srv://') ? '8.8.4.4' : ''))
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length > 0) setServers(dnsServers);

  global.mongooseConn = import('mongoose')
    .then(({ default: mongooseRuntime }) => mongooseRuntime.connect(uri))
    .catch((error) => {
      global.mongooseConn = undefined;
      throw error;
    });

  try {
    return await global.mongooseConn;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown MongoDB connection error';
    throw new Error(
      `MongoDB connection failed. Check MONGODB_URI and ensure the database is reachable. ${message}`
    );
  }
}
