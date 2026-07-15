import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/categories/slug/:slug — Get category by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const category = await Category.findOne({
      slug,
      isActive: true,
    });

    if (!category) {
      return fail('Category not found', 404);
    }

    return ok({ category });
  } catch (error) {
    return serverError(error, 'Server error while fetching category');
  }
}
