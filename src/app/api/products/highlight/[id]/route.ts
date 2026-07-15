import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// POST /api/products/highlight/:id — Add product to highlighted list (private/admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id);

    if (!product) {
      return fail('Product not found', 404);
    }

    // Get the highest highlight order
    const highestOrder = await Product.findOne({ isHighlighted: true })
      .sort({ highlightOrder: -1 })
      .select('highlightOrder');

    const newOrder = highestOrder ? highestOrder.highlightOrder + 1 : 1;

    product.isHighlighted = true;
    product.highlightOrder = newOrder;
    await product.save();

    return ok({ product }, 200, 'Product added to highlighted list');
  } catch (error) {
    return serverError(error, 'Server error while highlighting product');
  }
}

// DELETE /api/products/highlight/:id — Remove product from highlighted list (private/admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id);

    if (!product) {
      return fail('Product not found', 404);
    }

    product.isHighlighted = false;
    product.set('highlightOrder', undefined);
    await product.save();

    return ok(undefined, 200, 'Product removed from highlighted list');
  } catch (error) {
    return serverError(error, 'Server error while unhighlighting product');
  }
}
