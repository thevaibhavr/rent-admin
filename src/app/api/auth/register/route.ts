import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { signToken } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

type FieldError = { type: 'field'; value: unknown; msg: string; path: string; location: 'body' };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register — Register a new user (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const errors: FieldError[] = [];

    const name = typeof body.name === 'string' ? body.name.trim() : body.name;
    if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
      errors.push({ type: 'field', value: body.name, msg: 'Name must be between 2 and 50 characters', path: 'name', location: 'body' });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email;
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      errors.push({ type: 'field', value: body.email, msg: 'Please provide a valid email', path: 'email', location: 'body' });
    }

    const password = body.password;
    if (typeof password !== 'string' || password.length < 6) {
      errors.push({ type: 'field', value: password, msg: 'Password must be at least 6 characters', path: 'password', location: 'body' });
    }

    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    const phone = typeof body.phone === 'string' ? body.phone.trim() : body.phone;
    const address = body.address;

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return fail('User already exists with this email', 400);
    }

    // Create new user
    const user = new User({ name, email, password, phone, address });
    await user.save();

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
        },
        token,
      },
      201,
      'User registered successfully'
    );
  } catch (error) {
    return serverError(error, 'Server error during registration');
  }
}
