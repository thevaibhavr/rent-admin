"use client";

import React from 'react';
import BookingsCalendar from '@/components/BookingsCalendar';
import ProtectedRoute from '@/components/ProtectedRoute';

function ViewBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">View Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all rental bookings
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
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