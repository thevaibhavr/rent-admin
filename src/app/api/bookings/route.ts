/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/lib/models/Booking';
// Product must be imported so mongoose registers the schema used by populate('items.dressId') / populate('dressId')
import '@/lib/models/Product';
import Customer from '@/lib/models/Customer';
import { uploadImage } from '@/lib/cloudinary';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { expressError } from './errorHandler';

export const dynamic = 'force-dynamic';

// POST /api/bookings — Create booking
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    await connectDB();
    const data: any = await request.json().catch(() => ({}));

    // If images are base64 or url strings, upload dress/customer images when provided
    if (data.customer && data.customer.image && data.customer.image.startsWith('data:')) {
      const uploaded = await uploadImage(data.customer.image, 'bookings');
      data.customer.image = uploaded.url;
    }

    // Handle multiple items - upload images for each item
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.dressImage && item.dressImage.startsWith('data:')) {
          const uploaded = await uploadImage(item.dressImage, 'bookings');
          item.dressImage = uploaded.url;
        }
      }
    } else if (data.dressImage && data.dressImage.startsWith('data:')) {
      // Legacy single-item support
      const uploaded = await uploadImage(data.dressImage, 'bookings');
      data.dressImage = uploaded.url;
    }

    // Save or update customer information
    if (data.customer && data.customer.mobile) {
      try {
        let customer = await Customer.findOne({ mobile: data.customer.mobile });

        if (customer) {
          // Update existing customer
          customer = await Customer.findByIdAndUpdate(
            customer._id,
            {
              ...data.customer,
              totalBookings: (customer.totalBookings || 0) + 1,
              lastBookingDate: new Date(),
            },
            { new: true }
          );
        } else {
          // Create new customer
          customer = await Customer.create({
            ...data.customer,
            totalBookings: 1,
            lastBookingDate: new Date(),
          });
        }

        // Store customer ID in booking for reference
        data.customer._id = customer!._id;
      } catch (customerError: any) {
        console.warn('Failed to save customer data:', customerError.message);
        // Continue with booking creation even if customer save fails
      }
    }

    const booking = await Booking.create(data);
    await booking.populate('items.dressId');
    return ok({ booking }, 201, 'Booking created');
  } catch (error) {
    return expressError(error);
  }
}

// GET /api/bookings — Get all bookings
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    await connectDB();
    const bookings = await Booking.find()
      .populate('items.dressId')
      .populate('dressId') // Legacy support
      .sort({ createdAt: -1 });
    return ok({ bookings }, 200, 'Bookings fetched');
  } catch (error) {
    return expressError(error);
  }
}
