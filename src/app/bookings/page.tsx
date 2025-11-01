"use client";

import React from 'react';
import BookingForm from '@/components/BookingForm';
import BookingsCalendar from '@/components/BookingsCalendar';
import ProtectedRoute from '@/components/ProtectedRoute';

function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Booking Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage rental bookings and calendar
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4 text-gray-900">Create Booking</h2>
          <BookingForm />
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4 text-gray-900">Bookings Calendar</h2>
          <BookingsCalendar />
        </div>
      </div>
    </div>
  );
}

export default function BookingsPageWrapper() {
  return (
    <ProtectedRoute>
      <BookingsPage />
    </ProtectedRoute>
  );
}
