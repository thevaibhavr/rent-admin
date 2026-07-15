import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User, { IUser } from '@/lib/models/User';

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export function signToken(id: string): string {
  return jwt.sign({ id }, jwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as jwt.SignOptions['expiresIn'],
  });
}

export type AuthResult =
  | { user: IUser; error?: undefined }
  | { user?: undefined; error: { message: string; status: 401 | 403 } };

// Port of middleware/auth.js `protect`
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer')) {
    return { error: { message: 'Not authorized, no token', status: 401 } };
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret()) as { id: string };

    await connectDB();
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return { error: { message: 'User not found', status: 401 } };
    }
    if (!user.isActive) {
      return { error: { message: 'User account is deactivated', status: 401 } };
    }
    return { user };
  } catch (error) {
    console.error('Token verification error:', error);
    return { error: { message: 'Not authorized, token failed', status: 401 } };
  }
}

// Port of middleware/auth.js `protect` + `admin` chain
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const result = await requireAuth(request);
  if (result.error) return result;
  if (result.user.role !== 'admin') {
    return { error: { message: 'Access denied. Admin privileges required.', status: 403 } };
  }
  return result;
}

// Port of middleware/auth.js `optionalAuth`
export async function optionalAuth(request: NextRequest): Promise<IUser | null> {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer')) return null;
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret()) as { id: string };
    await connectDB();
    return await User.findById(decoded.id).select('-password');
  } catch {
    return null;
  }
}
