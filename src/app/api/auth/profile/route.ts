import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAuth } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

type FieldError = { type: 'field'; value: unknown; msg: string; path: string; location: 'body' };

// PUT /api/auth/profile — Update user profile (private)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const errors: FieldError[] = [];

    let name = body.name;
    if (name !== undefined) {
      name = typeof name === 'string' ? name.trim() : name;
      if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
        errors.push({ type: 'field', value: body.name, msg: 'Name must be between 2 and 50 characters', path: 'name', location: 'body' });
      }
    }

    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    const phone = typeof body.phone === 'string' ? body.phone.trim() : body.phone;
    const address = body.address;

    await connectDB();

    const user = await User.findById(auth.user._id);
    if (!user) {
      return fail('User not found', 404);
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

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
      },
      200,
      'Profile updated successfully'
    );
  } catch (error) {
    return serverError(error, 'Server error while updating profile');
  }
}
