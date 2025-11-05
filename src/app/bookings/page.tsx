"use client";

import React from 'react';
import Link from 'next/link';
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/bookings/add" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-xl mb-2 text-gray-900">Create Booking</h2>
            <p className="text-gray-500">Add a new rental booking to the system</p>
          </div>
        </Link>
        <Link href="/bookings/view" className="block">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-xl mb-2 text-gray-900">View Bookings</h2>
            <p className="text-gray-500">View and manage all rental bookings</p>
          </div>
        </Link>
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
