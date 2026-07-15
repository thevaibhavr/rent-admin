/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/lib/models/Booking';
// Product must be imported so mongoose registers the schema used by populate('items.dressId') / populate('dressId')
import '@/lib/models/Product';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { expressError } from '../../errorHandler';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

// PUT /api/bookings/:id/cancel — Cancel booking
export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    await connectDB();
    const { id } = await context.params;
    const body: any = await request.json().catch(() => ({}));
    const { reason } = body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        status: 'canceled',
        canceledAt: new Date(),
        cancelReason: reason || '',
      },
      { new: true }
    )
      .populate('items.dressId')
      .populate('dressId');

    if (!booking) return fail('Booking not found', 404);
    return ok({ booking }, 200, 'Booking canceled');
  } catch (error) {
    return expressError(error);
  }
}
