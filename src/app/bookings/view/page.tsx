"use client";

import React from 'react';
import BookingsCalendar from '@/components/BookingsCalendar';
import ProtectedRoute from '@/components/ProtectedRoute';

function ViewBookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">View Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all rental bookings
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <BookingsCalendar />
      </div>
    </div>
  );
}

export default function ViewBookingsPageWrapper() {
  return (
    <ProtectedRoute>
      <ViewBookingsPage />
    </ProtectedRoute>
  );
}