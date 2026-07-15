import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Customer from '@/lib/models/Customer';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { unhandledError } from './_lib/errors';

export const dynamic = 'force-dynamic';

// POST /api/customers — Create customer (private)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const body = await request.json().catch(() => ({}));
    const customerData = { ...body };
    delete customerData._id; // Remove _id if present

    await connectDB();

    const customer = await Customer.create(customerData);
    return ok({ customer }, 201, 'Customer created');
  } catch (error) {
    return unhandledError(error);
  }
}

// GET /api/customers — Get all customers with pagination and search (private)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get('page') ?? '') || 1;
    const limit = parseInt(sp.get('limit') ?? '') || 10;
    const search = sp.get('search') || '';
    const sortBy = sp.get('sortBy') || 'createdAt';
    const sortOrder = sp.get('sortOrder') === 'asc' ? 1 : -1;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      };
    }

    await connectDB();

    const customers = await Customer.find(query)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    return ok(
      {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      200,
      'Customers fetched'
    );
  } catch (error) {
    return unhandledError(error);
  }
}
