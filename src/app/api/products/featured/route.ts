import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import '@/lib/models/Category';
import '@/lib/models/Merchant';
import { optionalAuth } from '@/lib/auth';
import { ok, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/products/featured — Get featured products for hero section (public)
export async function GET(request: NextRequest) {
  try {
    await optionalAuth(request);
    await connectDB();

    const limit = request.nextUrl.searchParams.get('limit') ?? '6';

    const featuredProducts = await Product.find({
      isFeatured: true,
      isAvailable: true,
    })
      .populate('categories', 'name slug')
      .populate('Owner', 'name mobilenumber address')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .exec();

    return ok({ products: featuredProducts });
  } catch (error) {
    return serverError(error, 'Server error while fetching featured products');
  }
}
