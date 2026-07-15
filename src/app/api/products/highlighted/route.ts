import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import '@/lib/models/Category';
import '@/lib/models/Merchant';
import { optionalAuth } from '@/lib/auth';
import { ok, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/products/highlighted — Get highlighted products for hero section (public)
export async function GET(request: NextRequest) {
  try {
    await optionalAuth(request);
    await connectDB();

    const limit = request.nextUrl.searchParams.get('limit') ?? '10';

    const highlightedProducts = await Product.find({
      isHighlighted: true,
      isAvailable: true,
    })
      .populate('categories', 'name slug')
      .populate('Owner', 'name mobilenumber address')
      .sort({ highlightOrder: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .exec();

    return ok({ products: highlightedProducts });
  } catch (error) {
    return serverError(error, 'Server error while fetching highlighted products');
  }
}
