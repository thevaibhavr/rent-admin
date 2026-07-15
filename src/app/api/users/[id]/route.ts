import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

type FieldError = { type: 'field'; value: unknown; msg: string; path: string; location: 'body' };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/users/:id — Get single user (admin only)
export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const { id } = await params;
    await connectDB();

    const user = await User.findById(id).select('-password');

    if (!user) {
      return fail('User not found', 404);
    }

    return ok({ user });
  } catch (error) {
    return serverError(error, 'Server error while fetching user');
  }
}

// PUT /api/users/:id — Update user (admin only)
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const errors: FieldError[] = [];

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : body.name;
      if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
        errors.push({ type: 'field', value: body.name, msg: 'Name must be between 2 and 50 characters', path: 'name', location: 'body' });
      } else {
        body.name = name;
      }
    }

    if (body.email !== undefined) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email;
      if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        errors.push({ type: 'field', value: body.email, msg: 'Please provide a valid email', path: 'email', location: 'body' });
      } else {
        body.email = email;
      }
    }

    if (body.role !== undefined && !['user', 'admin'].includes(body.role)) {
      errors.push({ type: 'field', value: body.role, msg: 'Valid role is required', path: 'role', location: 'body' });
    }

    if (body.phone !== undefined && typeof body.phone === 'string') {
      body.phone = body.phone.trim();
    }

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      errors.push({ type: 'field', value: body.isActive, msg: 'isActive must be a boolean', path: 'isActive', location: 'body' });
    }

    if (body.emailVerified !== undefined && typeof body.emailVerified !== 'boolean') {
      errors.push({ type: 'field', value: body.emailVerified, msg: 'emailVerified must be a boolean', path: 'emailVerified', location: 'body' });
    }

    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return fail('User not found', 404);
    }

    // Check if email is being changed and if it already exists
    if (body.email && body.email !== user.email) {
      const existingUser = await User.findOne({ email: body.email });
      if (existingUser) {
        return fail('User with this email already exists', 400);
      }
    }

    // Update fields
    const updateFields = ['name', 'email', 'role', 'phone', 'address', 'isActive', 'emailVerified'] as const;
    updateFields.forEach((field) => {
      if (body[field] !== undefined) {
        (user as unknown as Record<string, unknown>)[field] = body[field];
      }
    });

    await user.save();

    return ok({ user }, 200, 'User updated successfully');
  } catch (error) {
    return serverError(error, 'Server error while updating user');
  }
}

// DELETE /api/users/:id — Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const { id } = await params;
    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return fail('User not found', 404);
    }

    // Prevent admin from deleting themselves
    if (String(user._id) === String(auth.user._id)) {
      return fail('Cannot delete your own account', 400);
    }

    await User.findByIdAndDelete(id);

    // Express sends { success: true, message } with no data key
    return ok(undefined, 200, 'User deleted successfully');
  } catch (error) {
    return serverError(error, 'Server error while deleting user');
  }
}
