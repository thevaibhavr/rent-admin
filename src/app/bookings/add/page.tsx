"use client";

import React from 'react';
import BookingForm from '@/components/BookingForm';
import ProtectedRoute from '@/components/ProtectedRoute';

function AddBookingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Create New Booking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new rental booking to the system
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
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