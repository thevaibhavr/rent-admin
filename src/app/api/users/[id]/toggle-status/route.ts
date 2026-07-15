import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

// PUT /api/users/:id/toggle-status — Toggle user active status (admin only)
export async function PUT(request: NextRequest, { params }: RouteContext) {
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

    // Prevent admin from deactivating themselves
    if (String(user._id) === String(auth.user._id)) {
      return fail('Cannot deactivate your own account', 400);
    }

    user.isActive = !user.isActive;
    await user.save();

    return ok({ user }, 200, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    return serverError(error, 'Server error while toggling user status');
  }
}
