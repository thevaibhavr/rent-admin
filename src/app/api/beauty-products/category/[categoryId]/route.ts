import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { ok, serverError } from '@/lib/apiResponse';
import BeautyProduct from '@/lib/models/BeautyProduct';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ categoryId: string }> };

// GET /api/beauty-products/category/:categoryId — Get beauty products by category id (public)
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { categoryId } = await params;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') ?? '1';
    const limit = searchParams.get('limit') ?? '12';
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    const sortOptions: Record<string, 1 | -1> = { [sort]: order === 'desc' ? -1 : 1 };

    const filter = { categories: categoryId, isAvailable: true };

    const products = await BeautyProduct.find(filter)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await BeautyProduct.countDocuments(filter);

    return ok({
      products,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error('Get beauty products by category error:', error);
    return serverError(error, 'Server error while fetching beauty products');
  }
}
