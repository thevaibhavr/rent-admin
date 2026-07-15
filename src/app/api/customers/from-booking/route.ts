import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Customer from '@/lib/models/Customer';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { unhandledError } from '../_lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/customers/from-booking — Save customer from booking (create or update) (private)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const body = await request.json().catch(() => ({}));
    const { mobile, ...customerData } = body;

    await connectDB();

    // Find existing customer by mobile
    let customer = await Customer.findOne({ mobile });

    if (customer) {
      // Update existing customer
      customer = await Customer.findByIdAndUpdate(
        customer._id,
        {
          ...customerData,
          mobile, // Ensure mobile stays the same
          lastBookingDate: new Date(),
          totalBookings: (customer.totalBookings || 0) + 1,
        },
        { new: true }
      );
    } else {
      // Create new customer
      customer = await Customer.create({
        ...customerData,
        mobile,
        totalBookings: 1,
        lastBookingDate: new Date(),
      });
    }

    return ok({ customer }, 200, 'Customer saved');
  } catch (error) {
    return unhandledError(error);
  }
}
