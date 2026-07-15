import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Supercategory from '@/lib/models/Supercategory';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/supercategories/all — Get all supercategories (including inactive)
// (admin)
// Note: this static segment takes precedence over [id], matching the Express
// router where /all was declared before /:id.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    await connectDB();

    const supercategories = await Supercategory.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .exec();

    return ok({ supercategories });
  } catch (error) {
    return serverError(error, 'Server error while fetching supercategories');
  }
}
