"use client";

import React from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

function BookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Booking Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage rental bookings and calendar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link href="/bookings/add" className="group block">
          <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
              <PlusIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Booking</h2>
              <p className="mt-1 text-sm text-gray-500">Add a new rental booking to the system</p>
            </div>
          </div>
        </Link>

        <Link href="/bookings/view" className="group block">
          <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">View Bookings</h2>
              <p className="mt-1 text-sm text-gray-500">View and manage all rental bookings</p>
            </div>
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
