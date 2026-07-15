import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Merchant from '@/lib/models/Merchant';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

// Mirrors express-validator's errors.array() entries
type FieldError = { type: 'field'; value: unknown; msg: string; path: string; location: 'body' };

const NUMERIC_REGEX = /^[+-]?\d+(\.\d+)?$/;

// GET /api/merchants/:id — Get single merchant (admin only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { id } = await params;

    await connectDB();

    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return fail('Merchant not found', 404);
    }

    return ok({ merchant });
  } catch (error) {
    console.error('Get merchant error:', error);
    return serverError(error, 'Server error while fetching merchant');
  }
}

// PUT /api/merchants/:id — Update merchant (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const errors: FieldError[] = [];
    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : body.name;
      if (typeof name !== 'string' || name.length < 2 || name.length > 100) {
        errors.push({ type: 'field', value: body.name, msg: 'Name must be between 2 and 100 characters', path: 'name', location: 'body' });
      } else {
        body.name = name;
      }
    }
    if (body.mobilenumber !== undefined && !NUMERIC_REGEX.test(String(body.mobilenumber))) {
      errors.push({ type: 'field', value: body.mobilenumber, msg: 'Mobile number must be numeric', path: 'mobilenumber', location: 'body' });
    }
    if (body.address !== undefined && typeof body.address === 'string') {
      body.address = body.address.trim();
    }
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return fail('Merchant not found', 404);
    }

    // Update merchant
    const updatedMerchant = await Merchant.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    return ok({ merchant: updatedMerchant }, 200, 'Merchant updated successfully');
  } catch (error) {
    console.error('Update merchant error:', error);
    return serverError(error, 'Server error while updating merchant');
  }
}

// DELETE /api/merchants/:id — Delete merchant (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { id } = await params;

    await connectDB();

    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return fail('Merchant not found', 404);
    }

    await Merchant.findByIdAndDelete(id);

    // Source responds { success: true, message: 'Merchant deleted successfully' } with no data
    return NextResponse.json({ success: true, message: 'Merchant deleted successfully' });
  } catch (error) {
    console.error('Delete merchant error:', error);
    return serverError(error, 'Server error while deleting merchant');
  }
}
