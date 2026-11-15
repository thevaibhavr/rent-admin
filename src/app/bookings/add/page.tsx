"use client";

import React from 'react';
import BookingForm from '@/components/BookingForm';
import ProtectedRoute from '@/components/ProtectedRoute';

function AddBookingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create Booking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new rental booking to the system
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <BookingForm />
      </div>
    </div>
  );
}

export default function AddBookingPageWrapper() {
  return (
    <ProtectedRoute>
      <AddBookingPage />
    </ProtectedRoute>
  );
}