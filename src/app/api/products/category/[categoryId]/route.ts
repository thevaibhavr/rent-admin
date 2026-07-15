import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import '@/lib/models/Category';
import '@/lib/models/Merchant';
import { optionalAuth } from '@/lib/auth';
import { ok, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/products/category/:categoryId — Get products by category (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    await optionalAuth(request);
    await connectDB();

    const sp = request.nextUrl.searchParams;
    const page = Number(sp.get('page') ?? 1);
    const limit = Number(sp.get('limit') ?? 12);
    const sort = sp.get('sort') ?? 'createdAt';
    const order = sp.get('order') ?? 'desc';

    const sortOptions: Record<string, 1 | -1> = { [sort]: order === 'desc' ? -1 : 1 };

    const products = await Product.find({
      categories: categoryId,
      isAvailable: true,
    })
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .populate('Owner', 'name mobilenumber address')
      .sort(sortOptions)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments({
      categories: categoryId,
      isAvailable: true,
    });

    return ok({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    return serverError(error, 'Server error while fetching products');
  }
}
