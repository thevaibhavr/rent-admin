/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Booking from '@/lib/models/Booking';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { expressError } from '../../errorHandler';

export const dynamic = 'force-dynamic';

// GET /api/bookings/stats/summary — Get booking statistics
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter');
    const week = searchParams.get('week');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let dateFilter: any = {};
    let filterPeriod: { start?: Date; end?: Date } = {};

    // Apply date filters
    if (filter === 'week' && week) {
      // week format: YYYY-WW (e.g., 2024-01 for first week of 2024)
      // Using ISO week calculation
      const [yearNum, weekNum] = week.split('-').map(Number);
      // Simple calculation: Jan 4 is always in week 1
      const simple = new Date(yearNum, 0, 4);
      const jan4Day = simple.getDay() || 7; // Convert Sunday (0) to 7
      const weekStart = new Date(simple);
      weekStart.setDate(simple.getDate() - jan4Day + 1 + (weekNum - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      dateFilter = {
        createdAt: {
          $gte: weekStart,
          $lte: weekEnd,
        },
      };
      filterPeriod = { start: weekStart, end: weekEnd };
    } else if (filter === 'month' && month && year) {
      // month format: 0-11 (0 = January, 11 = December)
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const startOfMonth = new Date(yearNum, monthNum, 1);
      const endOfMonth = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999);

      dateFilter = {
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      };
      filterPeriod = { start: startOfMonth, end: endOfMonth };
    } else if (filter === 'year' && year) {
      const yearNum = parseInt(year);
      const startOfYear = new Date(yearNum, 0, 1);
      const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59, 999);

      dateFilter = {
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear,
        },
      };
      filterPeriod = { start: startOfYear, end: endOfYear };
    }

    const allBookings = await Booking.find(dateFilter);

    // Calculate total bookings
    const totalBookings = allBookings.length;

    // Calculate unique customers (by mobile number, fallback to name)
    const customerMap = new Map<string, { name: string; mobile?: string; firstBookingDate: Date; bookingCount: number }>();
    allBookings.forEach((booking) => {
      const customerKey = booking.customer?.mobile || booking.customer?.name || 'unknown';
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          name: booking.customer?.name || 'Unknown',
          mobile: booking.customer?.mobile,
          firstBookingDate: booking.createdAt,
          bookingCount: 0,
        });
      }
      const customer = customerMap.get(customerKey)!;
      customer.bookingCount += 1;
      // Update first booking date if this booking is earlier
      if (new Date(booking.createdAt) < new Date(customer.firstBookingDate)) {
        customer.firstBookingDate = booking.createdAt;
      }
    });

    const totalCustomers = customerMap.size;

    // Calculate new customers based on filter period or current month
    let newCustomers;
    if (filterPeriod.start && filterPeriod.end) {
      newCustomers = Array.from(customerMap.values()).filter((customer) => {
        const firstBooking = new Date(customer.firstBookingDate);
        return firstBooking >= filterPeriod.start! && firstBooking <= filterPeriod.end!;
      }).length;
    } else {
      // Default: first booking in current month
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      newCustomers = Array.from(customerMap.values()).filter(
        (customer) => new Date(customer.firstBookingDate) >= currentMonthStart
      ).length;
    }

    // Calculate repeat customers (customers with more than 1 booking)
    const repeatCustomers = Array.from(customerMap.values()).filter(
      (customer) => customer.bookingCount > 1
    ).length;

    // Calculate financial metrics
    const totalRevenue = allBookings.reduce((sum, booking) => {
      if (booking.items && booking.items.length > 0) {
        return sum + booking.items.reduce((itemSum, item) => itemSum + (item.priceAfterBargain || 0), 0);
      }
      return sum + (booking.priceAfterBargain || 0);
    }, 0);
    const totalAdvance = allBookings.reduce((sum, booking) => {
      if (booking.items && booking.items.length > 0) {
        return sum + booking.items.reduce((itemSum, item) => itemSum + (item.advance || 0), 0);
      }
      return sum + (booking.advance || 0);
    }, 0);
    const totalPending = allBookings.reduce((sum, booking) => {
      if (booking.items && booking.items.length > 0) {
        return sum + booking.items.reduce((itemSum, item) => itemSum + (item.pending || 0), 0);
      }
      return sum + (booking.pending || 0);
    }, 0);
    const totalSecurity = allBookings.reduce((sum, booking) => {
      if (booking.items && booking.items.length > 0) {
        return sum + booking.items.reduce((itemSum, item) => itemSum + (item.securityAmount || 0), 0);
      }
      return sum + (booking.securityAmount || 0);
    }, 0);

    const totalPaid = allBookings.reduce((sum, booking) => {
      return sum + (booking.totalPaid || 0);
    }, 0);

    const totalBookingAmount = allBookings.reduce((sum, booking) => {
      return sum + (booking.totalBookingAmount || 0);
    }, 0);

    const totalFinalPayment = allBookings.reduce((sum, booking) => {
      return sum + (booking.totalFinalPayment || 0);
    }, 0);

    const totalTransportCost = allBookings.reduce((sum, booking) => {
      return sum + (booking.totalTransportCost || 0);
    }, 0);

    const totalDryCleaningCost = allBookings.reduce((sum, booking) => {
      return sum + (booking.totalDryCleaningCost || 0);
    }, 0);

    const totalRepairCost = allBookings.reduce((sum, booking) => {
      return sum + (booking.totalRepairCost || 0);
    }, 0);

    const totalOperationalCost = allBookings.reduce((sum, booking) => {
      return sum + (booking.totalOperationalCost || 0);
    }, 0);

    const grossProfit = allBookings.reduce((sum, booking) => {
      return sum + (booking.grossProfit || 0);
    }, 0);

    const netProfit = allBookings.reduce((sum, booking) => {
      return sum + (booking.netProfit || 0);
    }, 0);

    // Calculate bookings by status
    const activeBookings = allBookings.filter((booking) => {
      if (booking.status === 'canceled') return false;
      if (booking.items && booking.items.length > 0) {
        return booking.items.some((item) => !item.receiveDate);
      }
      return !booking.receiveDate;
    }).length;
    const completedBookings = allBookings.filter((booking) => {
      if (booking.status === 'canceled') return false;
      if (booking.items && booking.items.length > 0) {
        return booking.items.every((item) => item.receiveDate);
      }
      return booking.receiveDate;
    }).length;
    const canceledBookings = allBookings.filter((booking) => booking.status === 'canceled').length;

    // Calculate bookings by status (based on dates)
    const pendingBookings = allBookings.filter((booking) => {
      if (booking.status === 'canceled') return false;
      if (booking.items && booking.items.length > 0) {
        return booking.items.some((item) => !item.sendDate || (item.sendDate && !item.receiveDate));
      }
      return !booking.sendDate || (booking.sendDate && !booking.receiveDate);
    }).length;

    const stats = {
      totalBookings,
      totalCustomers,
      newCustomers,
      repeatCustomers,
      totalRevenue,
      totalAdvance,
      totalPending,
      totalSecurity,
      totalPaid,
      totalBookingAmount,
      totalFinalPayment,
      totalTransportCost,
      totalDryCleaningCost,
      totalRepairCost,
      totalOperationalCost,
      grossProfit,
      netProfit,
      activeBookings,
      completedBookings,
      canceledBookings,
      pendingBookings,
    };

    return ok({ summary: stats }, 200, 'Booking statistics fetched');
  } catch (error) {
    return expressError(error);
  }
}
