import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// GET /api/orders/stats/summary — Get order statistics (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    await connectDB();

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const completedOrders = await Order.countDocuments({ orderStatus: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'Cancelled' });

    // Calculate total revenue
    const revenueData = await Order.aggregate([
      { $match: { orderStatus: { $in: ['Delivered', 'Paid'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    return ok({
      summary: {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    return serverError(error, 'Server error while fetching order statistics');
  }
}
