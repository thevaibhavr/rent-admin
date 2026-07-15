import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { computeOrder, CreateOrderBody } from '../_lib/createOrder';

export const dynamic = 'force-dynamic';

// POST /api/orders/guest — Create new order for guest users (public)
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as CreateOrderBody;

    await connectDB();

    const result = await computeOrder(body);
    if (result.failure) {
      return fail(result.failure.message, result.failure.status, result.failure.errors);
    }

    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      startDate,
      endDate,
      needDateObj,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      notes,
    } = result.data;

    const order = new Order({
      user: null, // No user for guest orders
      items: orderItems,
      shippingAddress,
      paymentMethod,
      rentalStartDate: startDate,
      rentalEndDate: endDate,
      needDate: needDateObj,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      notes,
      isGuestOrder: true, // Mark as guest order
    });

    await order.save();

    // Populate product details for response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name images price');

    return ok({ order: populatedOrder }, 201, 'Order created successfully');
  } catch (error) {
    console.error('Create guest order error:', error);
    return serverError(error, 'Server error while creating order');
  }
}
