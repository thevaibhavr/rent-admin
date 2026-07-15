import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAuth } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

type FieldError = { type: 'field'; value: unknown; msg: string; path: string; location: 'body' };

// POST /api/auth/change-password — Change user password (private)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const errors: FieldError[] = [];

    const { currentPassword, newPassword } = body;

    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
      errors.push({ type: 'field', value: currentPassword, msg: 'Current password is required', path: 'currentPassword', location: 'body' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      errors.push({ type: 'field', value: newPassword, msg: 'New password must be at least 6 characters', path: 'newPassword', location: 'body' });
    }

    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const user = await User.findById(auth.user._id).select('+password');
    if (!user) {
      return fail('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return fail('Current password is incorrect', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Express sends { success: true, message } with no data key
    return ok(undefined, 200, 'Password changed successfully');
  } catch (error) {
    return serverError(error, 'Server error while changing password');
  }
}
