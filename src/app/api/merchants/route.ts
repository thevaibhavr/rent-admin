import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Merchant from '@/lib/models/Merchant';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// Mirrors express-validator's errors.array() entries
type FieldError = { type: 'field'; value: unknown; msg: string; path: string; location: 'body' };

const NUMERIC_REGEX = /^[+-]?\d+(\.\d+)?$/;

// GET /api/merchants — Get all merchants with pagination (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const sp = request.nextUrl.searchParams;
    const page = sp.get('page') ?? '1';
    const limit = sp.get('limit') ?? '10';
    const search = sp.get('search');

    // Build filter object
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    await connectDB();

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const merchants = await Merchant.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum * 1)
      .skip((pageNum - 1) * limitNum)
      .exec();

    const total = await Merchant.countDocuments(filter);

    return ok({
      merchants,
      totalPages: Math.ceil(total / limitNum),
      currentPage: parseInt(page),
      total,
      hasNextPage: pageNum * limitNum < total,
      hasPrevPage: pageNum > 1,
    });
  } catch (error) {
    console.error('Get merchants error:', error);
    return serverError(error, 'Server error while fetching merchants');
  }
}

// POST /api/merchants — Create new merchant (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const body = await request.json().catch(() => ({}));

    const errors: FieldError[] = [];
    const name = typeof body.name === 'string' ? body.name.trim() : body.name;
    if (typeof name !== 'string' || name.length < 2 || name.length > 100) {
      errors.push({ type: 'field', value: body.name, msg: 'Name must be between 2 and 100 characters', path: 'name', location: 'body' });
    }
    if (body.mobilenumber !== undefined && !NUMERIC_REGEX.test(String(body.mobilenumber))) {
      errors.push({ type: 'field', value: body.mobilenumber, msg: 'Mobile number must be numeric', path: 'mobilenumber', location: 'body' });
    }
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    const mobilenumber = body.mobilenumber;
    const address = typeof body.address === 'string' ? body.address.trim() : body.address;

    await connectDB();

    const merchant = new Merchant({
      name,
      mobilenumber,
      address,
    });

    await merchant.save();

    return ok({ merchant }, 201, 'Merchant created successfully');
  } catch (error) {
    console.error('Create merchant error:', error);
    return serverError(error, 'Server error while creating merchant');
  }
}
