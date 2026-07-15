import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/auth/me — Get current user profile (private)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const user = auth.user;

    return ok({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return serverError(error, 'Server error while fetching profile');
  }
}
