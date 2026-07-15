import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import '@/lib/models/Category';
import '@/lib/models/Merchant';
import { optionalAuth } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/products/slug/:slug — Get product by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const user = await optionalAuth(request);
    await connectDB();

    const product = await Product.findOne({
      slug,
      isAvailable: true,
    })
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .populate('Owner', 'name mobilenumber address');

    if (!product) {
      return fail('Product not found', 404);
    }

    // Increment views
    if (user) {
      product.views += 1;
      await product.save();
    }

    return ok({ product });
  } catch (error) {
    return serverError(error, 'Server error while fetching product');
  }
}
