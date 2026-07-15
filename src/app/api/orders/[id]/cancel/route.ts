import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { requireAuth } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// PUT /api/orders/:id/cancel — Cancel order (user can cancel pending orders, admin can cancel any)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      return fail('Order not found', 404);
    }

    // Check if user can cancel this order
    if (auth.user.role !== 'admin' && order.user!.toString() !== String(auth.user._id)) {
      return fail('Access denied', 403);
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['Pending', 'Confirmed'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return fail('Order cannot be cancelled in its current status', 400);
    }

    order.orderStatus = 'Cancelled';
    if (auth.user.role === 'admin') {
      order.adminNotes = body.adminNotes || 'Order cancelled by admin';
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name images price');

    return ok({ order: updatedOrder }, 200, 'Order cancelled successfully');
  } catch (error) {
    console.error('Cancel order error:', error);
    return serverError(error, 'Server error while cancelling order');
  }
}
