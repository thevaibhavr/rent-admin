import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import type { FieldError } from '../../_lib/createOrder';

export const dynamic = 'force-dynamic';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Returned', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'];

// PUT /api/orders/:id/status — Update order status (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const errors: FieldError[] = [];
    if (typeof body.orderStatus !== 'string' || !ORDER_STATUSES.includes(body.orderStatus)) {
      errors.push({ type: 'field', value: body.orderStatus, msg: 'Valid order status is required', path: 'orderStatus', location: 'body' });
    }
    if (body.paymentStatus !== undefined && (typeof body.paymentStatus !== 'string' || !PAYMENT_STATUSES.includes(body.paymentStatus))) {
      errors.push({ type: 'field', value: body.paymentStatus, msg: 'Valid payment status is required', path: 'paymentStatus', location: 'body' });
    }
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    const { orderStatus, paymentStatus } = body;
    const adminNotes = typeof body.adminNotes === 'string' ? body.adminNotes.trim() : body.adminNotes;

    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      return fail('Order not found', 404);
    }

    // Update status
    order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (adminNotes) order.adminNotes = adminNotes;

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name images price');

    return ok({ order: updatedOrder }, 200, 'Order status updated successfully');
  } catch (error) {
    console.error('Update order status error:', error);
    return serverError(error, 'Server error while updating order status');
  }
}
