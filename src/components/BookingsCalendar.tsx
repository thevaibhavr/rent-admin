"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { apiService } from '@/services/api';
import { Booking } from '@/types';
import Image from 'next/image';
import BookingForm from './BookingForm';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
}

const locales = {
  "en-US": enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Props {
  onRefresh?: () => void;
}

const BookingsCalendar: React.FC<Props> = ({ onRefresh }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [date, setDate] = useState(new Date());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await apiService.getBookings();
      setBookings(res.bookings || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Convert bookings to calendar events with proper date handling
  const events = bookings.map(booking => {
    const startDate = booking.sendDate ? new Date(booking.sendDate) : new Date();
    const endDate = booking.receiveDate ? new Date(booking.receiveDate) : new Date();
    // Set end date to end of the receive date (23:59:59)
    endDate.setHours(0, 0, 0, 0);
    
    const dressName = (booking as unknown as { dressId?: { name?: string } }).dressId?.name || 'Dress';
    const isCanceled = booking.status === 'canceled';
    
    return {
      id: booking._id,
      title: `${booking.customer.name} - ${dressName}${isCanceled ? ' (Canceled)' : ''}`,
      start: startDate,
      end: endDate,
      resource: booking,
      allDay: true
    };
  });

  const handleSelectEvent = (event: Event) => {
    const calendarEvent = event as unknown as CalendarEvent;
    setSelected(calendarEvent.resource);
    setIsEditing(false);
  };

  const handleEditSave = async (updatedBooking: Partial<Booking>) => {
    try {
      await apiService.updateBooking(selected!._id, updatedBooking);
      setIsEditing(false);
      setSelected(null);
      fetchBookings();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to update booking:', err);
      alert('Failed to update booking');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    
    try {
      await apiService.deleteBooking(selected._id);
      setShowDeleteConfirm(false);
      setSelected(null);
      setIsEditing(false);
      fetchBookings();
      if (onRefresh) onRefresh();
      alert('Booking deleted successfully');
    } catch (err) {
      console.error('Failed to delete booking:', err);
      alert('Failed to delete booking');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    if (!selected) return;
    
    try {
      await apiService.cancelBooking(selected._id, cancelReason);
      setShowCancelConfirm(false);
      setCancelReason('');
      setSelected(null);
      setIsEditing(false);
      fetchBookings();
      if (onRefresh) onRefresh();
      alert('Booking canceled successfully');
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking');
    }
  };

  const handleCancelModalCancel = () => {
    setShowCancelConfirm(false);
    setCancelReason('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <style jsx global>{`
            .rbc-event {
              background-color: #4f46e5 !important;
              border: none !important;
              border-radius: 4px !important;
              padding: 2px 5px !important;
              font-size: 0.875rem !important;
              color: #000000 !important;
            }
            .rbc-event.canceled {
              background-color: #dc2626 !important;
              opacity: 0.7;
            }
            .rbc-event.rbc-selected {
              background-color: #4338ca !important;
              color: #000000 !important;
            }
            .rbc-day-slot .rbc-event {
              border: 1px solid #4f46e5 !important;
              color: #000000 !important;
            }
            .rbc-show-more {
              color: #000000 !important;
              font-weight: 500;
            }
            .rbc-event-content {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              color: #000000 !important;
            }
            .rbc-calendar {
              color: #000000 !important;
            }
            .rbc-header {
              color: #000000 !important;
            }
            .rbc-date-cell {
              color: #000000 !important;
            }
            .rbc-time-slot {
              color: #000000 !important;
            }
            .rbc-today {
              color: #000000 !important;
            }
            .rbc-off-range-bg {
              color: #000000 !important;
            }
            .rbc-toolbar {
              color: #000000 !important;
            }
            .rbc-toolbar button {
              color: #000000 !important;
            }
            .rbc-toolbar-label {
              color: #000000 !important;
            }
            .rbc-time-view {
              color: #000000 !important;
            }
            .rbc-day-view {
              color: #000000 !important;
            }
            .rbc-month-view {
              color: #000000 !important;
            }
            .rbc-agenda-view {
              color: #000000 !important;
            }
            .rbc-agenda-table {
              color: #000000 !important;
            }
            .rbc-agenda-date-cell {
              color: #000000 !important;
            }
            .rbc-agenda-time-cell {
              color: #000000 !important;
            }
            .rbc-agenda-event-cell {
              color: #000000 !important;
            }
          `}</style>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectEvent={handleSelectEvent}
            view={view}
            onView={(newView: View) => {
              if (newView === 'month' || newView === 'week' || newView === 'day') {
                setView(newView);
              }
            }}
            date={date}
            onNavigate={(newDate: Date) => setDate(newDate)}
            popup
            defaultView="month"
            views={['month', 'week', 'day']}
            formats={{
              eventTimeRangeFormat: () => '', // Remove time display from events
            }}
              components={{
              eventWrapper: (props) => {
                const event = props.event as unknown as CalendarEvent;
                const isCanceled = event.resource.status === 'canceled';
                const tooltip = [
                  event.title,
                  `Send: ${format(event.start, 'MMM d, yyyy')}`,
                  `Return: ${format(event.end, 'MMM d, yyyy')}`,
                  isCanceled ? 'Status: Canceled' : ''
                ].filter(Boolean).join('\n');
                
                return (
                  <div 
                    {...props}
                    title={tooltip}
                    className={`rounded-sm overflow-hidden ${isCanceled ? 'canceled' : ''} ${props.className || ''}`}
                  />
                );
              }
            }}
          />
        </div>
      </div>

      {/* Booking Details Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto text-black">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">
                {isEditing ? 'Edit Booking' : 'Booking Details'}
              </h3>
              <div className="flex gap-2">
                {!isEditing && selected.status !== 'canceled' && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleCancelClick}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Cancel Booking
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
                {selected.status === 'canceled' && (
                  <div className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                    Canceled
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelected(null);
                    setIsEditing(false);
                    setShowDeleteConfirm(false);
                    setShowCancelConfirm(false);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>

            {isEditing ? (
              <BookingForm
                initial={selected}
                onSaved={handleEditSave}
              />
            ) : (
              <div className="text-black">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 text-black">Dress Details</h4>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-black">{(selected as unknown as { dressId?: { name?: string } }).dressId?.name || 'N/A'}</div>
                      {selected.dressImage && (
                        <div className="relative h-48 w-full">
                          <Image
                            src={selected.dressImage}
                            alt="Dress"
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-black">Customer Details</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-black">Name: {selected.customer.name}</div>
                      <div className="text-sm text-black">Mobile: {selected.customer.mobile}</div>
                      <div className="text-sm text-black">Location: {selected.customer.location}</div>
                      {selected.customer.image && (
                        <div className="relative h-24 w-24">
                          <Image
                            src={selected.customer.image}
                            alt="Customer"
                            fill
                            className="object-cover rounded-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-black">
                  <div className="text-black">Price: ₹{selected.priceAfterBargain}</div>
                  <div className="text-black">Advance: ₹{selected.advance}</div>
                  <div className="text-black">Pending: ₹{selected.pending}</div>
                  <div className="text-black">Security: ₹{selected.securityAmount}</div>
                  <div className="text-black">Send Date: {selected.sendDate?.split('T')[0]}</div>
                  <div className="text-black">Receive Date: {selected.receiveDate?.split('T')[0]}</div>
                  {selected.referenceCustomer && (
                    <div className="col-span-2 text-black">
                      Reference: {selected.referenceCustomer}
                    </div>
                  )}
                  {selected.status === 'canceled' && (
                    <>
                      <div className="col-span-2 text-black">
                        <span className="font-medium text-red-600">Status: Canceled</span>
                      </div>
                      {selected.canceledAt && (
                        <div className="col-span-2 text-black">
                          Canceled At: {new Date(selected.canceledAt).toLocaleString()}
                        </div>
                      )}
                      {selected.cancelReason && (
                        <div className="col-span-2 text-black">
                          Cancel Reason: {selected.cancelReason}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 text-black">
            <h3 className="text-lg font-semibold text-black mb-4">Cancel Booking</h3>
            <p className="text-black mb-4">
              Are you sure you want to cancel the booking for <strong>{selected.customer.name}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-black">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                className="w-full rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-black"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelModalCancel}
                className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 text-black">
            <h3 className="text-lg font-semibold text-black mb-4">Confirm Delete</h3>
            <p className="text-black mb-6">
              Are you sure you want to delete the booking for <strong>{selected.customer.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsCalendar;
