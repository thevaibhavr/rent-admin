import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { requireAuth } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { computeOrder, CreateOrderBody } from './_lib/createOrder';

export const dynamic = 'force-dynamic';

// POST /api/orders — Create new order (private)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

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
      user: auth.user._id,
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
    });

    await order.save();

    // Populate product details for response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name images price');

    return ok({ order: populatedOrder }, 201, 'Order created successfully');
  } catch (error) {
    console.error('Create order error:', error);
    return serverError(error, 'Server error while creating order');
  }
}

// GET /api/orders — Get user orders (regular users) or all orders (admins) (private)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const sp = request.nextUrl.searchParams;
    const page = sp.get('page') ?? '1';
    const limit = sp.get('limit') ?? '10';
    const status = sp.get('status');
    const sort = sp.get('sort') ?? 'createdAt';
    const order = sp.get('order') ?? 'desc';

    const sortOptions: Record<string, 1 | -1> = { [sort]: order === 'desc' ? -1 : 1 };

    const filter: Record<string, unknown> = {};

    // If user is not admin, only show their orders
    if (auth.user.role !== 'admin') {
      filter.user = auth.user._id;
    }

    // Add status filter if provided
    if (status) {
      filter.orderStatus = status;
    }

    await connectDB();

    const limitNum = Number(limit);
    const pageNum = Number(page);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'name images price')
      .sort(sortOptions)
      .limit(limitNum * 1)
      .skip((pageNum - 1) * limitNum)
      .exec();

    const total = await Order.countDocuments(filter);

    return ok({
      orders,
      totalPages: Math.ceil(total / limitNum),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return serverError(error, 'Server error while fetching orders');
  }
}
