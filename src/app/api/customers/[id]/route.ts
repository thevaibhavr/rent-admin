import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Customer from '@/lib/models/Customer';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { unhandledError } from '../_lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/customers/:id — Get customer by ID (private)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { id } = await params;

    await connectDB();

    const customer = await Customer.findById(id);
    if (!customer) return fail('Customer not found', 404);

    return ok({ customer }, 200, 'Customer fetched');
  } catch (error) {
    return unhandledError(error);
  }
}

// PUT /api/customers/:id — Update customer (private)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    await connectDB();

    const customer = await Customer.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!customer) return fail('Customer not found', 404);

    return ok({ customer }, 200, 'Customer updated');
  } catch (error) {
    return unhandledError(error);
  }
}

// DELETE /api/customers/:id — Delete customer (soft delete) (private)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    const { id } = await params;

    await connectDB();

    const customer = await Customer.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!customer) return fail('Customer not found', 404);

    // Source responds { success: true, message: 'Customer deactivated' } with no data
    return NextResponse.json({ success: true, message: 'Customer deactivated' });
  } catch (error) {
    return unhandledError(error);
  }
}
