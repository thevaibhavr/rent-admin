import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { getCategoryTypeConfig } from '../lib';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ categoryType: string }> };

// GET /api/:categoryType/all — Get all categories including inactive (admin only)
export async function GET(request: NextRequest, { params }: Params) {
  const { categoryType } = await params;
  const config = getCategoryTypeConfig(categoryType);
  if (!config) {
    return fail('Not found', 404);
  }

  // Source used beautyAdmin (admin without a token) — replaced with strict admin auth
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    await connectDB();

    const query: Record<string, unknown> = {};
    // Only the beauty-categories router supports filtering by supercategory
    if (config.hasSupercategory) {
      const supercategory = request.nextUrl.searchParams.get('supercategory');
      if (supercategory) {
        query.supercategory = supercategory;
      }
    }

    let find = config.model.find(query);
    if (config.hasSupercategory) {
      find = find.populate('supercategory', 'name slug');
    }
    const categories = await find.sort({ sortOrder: 1, createdAt: -1 }).exec();

    return ok({ categories });
  } catch (error) {
    return serverError(error, `Server error while fetching ${config.plural}`);
  }
}
