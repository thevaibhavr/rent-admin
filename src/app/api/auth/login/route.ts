import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { signToken } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

type FieldError = { type: 'field'; value: unknown; msg: string; path: string; location: 'body' };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/login — Login user (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const errors: FieldError[] = [];

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email;
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      errors.push({ type: 'field', value: body.email, msg: 'Please provide a valid email', path: 'email', location: 'body' });
    }

    const password = body.password;
    if (typeof password !== 'string' || password.length === 0) {
      errors.push({ type: 'field', value: password, msg: 'Password is required', path: 'password', location: 'body' });
    }

    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return fail('Invalid credentials', 401);
    }

    if (!user.isActive) {
      return fail('Account is deactivated', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return fail('Invalid credentials', 401);
    }

    // Generate token
    const token = signToken(String(user._id));

    return ok(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          avatar: user.avatar,
        },
        token,
      },
      200,
      'Login successful'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown login error';

    if (message.toLowerCase().includes('mongodb') || message.toLowerCase().includes('connection')) {
      return fail('Database unavailable. Please check MONGODB_URI and make sure MongoDB is running.', 503);
    }

    return serverError(error, 'Server error during login');
  }
}
