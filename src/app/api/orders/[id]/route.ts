import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { requireAuth } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/orders/:id — Get single order (private)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { id } = await params;

    await connectDB();

    const order = await Order.findById(id)
      .populate('user', 'name email phone address')
      .populate('items.product', 'name images price originalPrice size color brand');

    if (!order) {
      return fail('Order not found', 404);
    }

    // Check if user can access this order
    const orderUser = order.user as unknown as { _id: { toString(): string } };
    if (auth.user.role !== 'admin' && orderUser._id.toString() !== String(auth.user._id)) {
      return fail('Access denied', 403);
    }

    return ok({ order });
  } catch (error) {
    console.error('Get order error:', error);
    return serverError(error, 'Server error while fetching order');
  }
}
