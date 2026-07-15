import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Customer from '@/lib/models/Customer';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { unhandledError } from '../../_lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/customers/stats/summary — Get customer statistics (private)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    await connectDB();

    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const activeCustomers = await Customer.countDocuments({
      isActive: true,
      lastBookingDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });

    // Get top customers by spending
    const topCustomers = await Customer.find({ isActive: true })
      .sort({ totalSpent: -1 })
      .limit(5)
      .select('name mobile totalSpent totalBookings');

    return ok(
      {
        summary: {
          totalCustomers,
          activeCustomers,
          topCustomers,
        },
      },
      200,
      'Customer statistics fetched'
    );
  } catch (error) {
    return unhandledError(error);
  }
}
