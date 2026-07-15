/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/lib/models/Booking';
// Product must be imported so mongoose registers the schema used by populate('items.dressId') / populate('dressId')
import '@/lib/models/Product';
import { uploadImage } from '@/lib/cloudinary';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { expressError } from '../errorHandler';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/bookings/:id — Get booking by id
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    await connectDB();
    const { id } = await context.params;
    const booking = await Booking.findById(id)
      .populate('items.dressId')
      .populate('dressId'); // Legacy support
    if (!booking) return fail('Booking not found', 404);
    return ok({ booking }, 200, 'Booking fetched');
  } catch (error) {
    return expressError(error);
  }
}

// PUT /api/bookings/:id — Update booking
export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    await connectDB();
    const { id } = await context.params;
    const body: any = await request.json().catch(() => ({}));
    const data: any = { ...body };

    // Remove immutable fields that shouldn't be updated
    delete data._id;
    delete data.__v;
    delete data.bookingId;
    delete data.createdAt;
    delete data.updatedAt;

    if (data.customer && data.customer.image && data.customer.image.startsWith('data:')) {
      const uploaded = await uploadImage(data.customer.image, 'bookings');
      data.customer.image = uploaded.url;
    }

    // Handle multiple items - upload images for each item and remove _id fields
    if (data.items && Array.isArray(data.items)) {
      // Use Promise.all with async map to handle image uploads
      data.items = await Promise.all(
        data.items.map(async (item: any) => {
          const cleanItem = { ...item };
          // Remove _id from item (subdocuments shouldn't have _id when updating)
          delete cleanItem._id;

          // Convert date strings to Date objects if needed
          if (cleanItem.sendDate && typeof cleanItem.sendDate === 'string') {
            cleanItem.sendDate = new Date(cleanItem.sendDate);
          }
          if (cleanItem.receiveDate && typeof cleanItem.receiveDate === 'string') {
            cleanItem.receiveDate = new Date(cleanItem.receiveDate);
          }
          if (cleanItem.useDressDate && typeof cleanItem.useDressDate === 'string') {
            cleanItem.useDressDate = new Date(cleanItem.useDressDate);
          }

          if (cleanItem.dressImage && cleanItem.dressImage.startsWith('data:')) {
            const uploaded = await uploadImage(cleanItem.dressImage, 'bookings');
            cleanItem.dressImage = uploaded.url;
          }

          return cleanItem;
        })
      );
    } else if (data.dressImage && data.dressImage.startsWith('data:')) {
      // Legacy single-item support
      const uploaded = await uploadImage(data.dressImage, 'bookings');
      data.dressImage = uploaded.url;
    }

    // Convert dates for legacy fields if present
    if (data.sendDate && typeof data.sendDate === 'string') {
      data.sendDate = new Date(data.sendDate);
    }
    if (data.receiveDate && typeof data.receiveDate === 'string') {
      data.receiveDate = new Date(data.receiveDate);
    }

    // Handle totalPaid for completed bookings
    if (data.status === 'completed' && data.totalPaid !== undefined) {
      // eslint-disable-next-line no-self-assign
      data.totalPaid = data.totalPaid; // Verbatim quirk from the Express source (no-op)
    }

    const booking = await Booking.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('items.dressId')
      .populate('dressId'); // Legacy support
    if (!booking) return fail('Booking not found', 404);

    // Manually recalculate totals since pre-save hook doesn't run on findByIdAndUpdate
    if (booking.items && booking.items.length > 0) {
      // Recalculate item-level totals first
      booking.items.forEach((item) => {
        // Recalculate total paid for each item
        item.totalPaid = (item.bookingAmount || 0) + (item.advance || 0) + (item.finalPayment || 0);

        // Recalculate total cost for each item (including additional costs)
        const itemAdditionalCosts = item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0;
        item.totalCost = (item.transportCost || 0) + (item.dryCleaningCost || 0) + (item.repairCost || 0) + itemAdditionalCosts;

        // Recalculate profit for each item
        item.profit = item.totalPaid - item.totalCost;
      });

      // Recalculate booking-level totals
      booking.totalPrice = booking.items.reduce((sum, item) => sum + (item.priceAfterBargain || 0), 0);
      booking.totalBookingAmount = booking.items.reduce((sum, item) => sum + (item.bookingAmount || 0), 0);
      booking.totalAdvance = booking.items.reduce((sum, item) => sum + (item.advance || 0), 0);
      booking.totalFinalPayment = booking.items.reduce((sum, item) => sum + (item.finalPayment || 0), 0);
      booking.totalPaid = booking.items.reduce((sum, item) => sum + (item.totalPaid || 0), 0);
      booking.totalPending = booking.items.reduce((sum, item) => sum + (item.pending || 0), 0);
      booking.totalSecurity = booking.items.reduce((sum, item) => sum + (item.securityAmount || 0), 0);

      // Recalculate operational costs
      booking.totalTransportCost = booking.items.reduce((sum, item) => sum + (item.transportCost || 0), 0);
      booking.totalDryCleaningCost = booking.items.reduce((sum, item) => sum + (item.dryCleaningCost || 0), 0);
      booking.totalRepairCost = booking.items.reduce((sum, item) => sum + (item.repairCost || 0), 0);
      const totalAdditionalCosts = booking.items.reduce((sum, item) => {
        return sum + (item.additionalCosts?.reduce((costSum, cost) => costSum + (cost.amount || 0), 0) || 0);
      }, 0);
      booking.totalOperationalCost = booking.totalTransportCost + booking.totalDryCleaningCost + booking.totalRepairCost + totalAdditionalCosts;

      // Recalculate profits
      booking.grossProfit = booking.totalPaid - booking.totalPrice;
      booking.netProfit = booking.grossProfit - booking.totalOperationalCost;

      // For completed bookings, totalPaid should already be set from the payload
      // If not set, calculate it from totalAdvance
      if (booking.status === 'completed' && !booking.totalPaid) {
        booking.totalPaid = booking.totalAdvance;
      }
    } else if (booking.priceAfterBargain) {
      // Legacy single-item support
      booking.totalPrice = booking.priceAfterBargain || 0;
      booking.totalAdvance = booking.advance || 0;
      booking.totalPending = booking.pending || 0;
      booking.totalSecurity = booking.securityAmount || 0;

      // For completed bookings, totalPaid should already be set from the payload
      // If not set, calculate it from totalAdvance
      if (booking.status === 'completed' && !booking.totalPaid) {
        booking.totalPaid = booking.totalAdvance;
      }
    }

    // Save the booking to trigger any additional hooks and persist the recalculated totals
    await booking.save();

    return ok({ booking }, 200, 'Booking updated');
  } catch (error) {
    return expressError(error);
  }
}

// DELETE /api/bookings/:id — Delete booking
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    await connectDB();
    const { id } = await context.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return fail('Booking not found', 404);
    // Source response has no `data` field: { success: true, message: 'Booking deleted' }
    return NextResponse.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    return expressError(error);
  }
}
