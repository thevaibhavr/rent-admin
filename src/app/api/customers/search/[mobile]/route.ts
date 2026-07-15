import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Customer from '@/lib/models/Customer';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { unhandledError } from '../../_lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/customers/search/:mobile — Get customers by mobile (for suggestions) (private)
export async function GET(request: NextRequest, { params }: { params: Promise<{ mobile: string }> }) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { mobile } = await params;

    await connectDB();

    const customers = await Customer.find({
      mobile: { $regex: mobile, $options: 'i' },
    }).limit(10);

    return ok({ customers }, 200, 'Customers found');
  } catch (error) {
    return unhandledError(error);
  }
}
