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
    
    return {
      id: booking._id,
      title: `${booking.customer.name} - ${dressName}`,
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
            }
            .rbc-event.rbc-selected {
              background-color: #4338ca !important;
            }
            .rbc-day-slot .rbc-event {
              border: 1px solid #4f46e5 !important;
            }
            .rbc-show-more {
              color: #4f46e5 !important;
              font-weight: 500;
            }
            .rbc-event-content {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
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
                const tooltip = [
                  event.title,
                  `Send: ${format(event.start, 'MMM d, yyyy')}`,
                  `Return: ${format(event.end, 'MMM d, yyyy')}`
                ].join('\n');
                
                return (
                  <div 
                    {...props}
                    title={tooltip}
                    className={`rounded-sm overflow-hidden ${props.className || ''}`}
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
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditing ? 'Edit Booking' : 'Booking Details'}
              </h3>
              <div className="flex gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelected(null);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
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
              <div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Dress Details</h4>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{(selected as unknown as { dressId?: { name?: string } }).dressId?.name || 'N/A'}</div>
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
                    <h4 className="font-medium mb-2">Customer Details</h4>
                    <div className="space-y-2">
                      <div className="text-sm">Name: {selected.customer.name}</div>
                      <div className="text-sm">Mobile: {selected.customer.mobile}</div>
                      <div className="text-sm">Location: {selected.customer.location}</div>
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

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>Price: ₹{selected.priceAfterBargain}</div>
                  <div>Advance: ₹{selected.advance}</div>
                  <div>Pending: ₹{selected.pending}</div>
                  <div>Security: ₹{selected.securityAmount}</div>
                  <div>Send Date: {selected.sendDate?.split('T')[0]}</div>
                  <div>Receive Date: {selected.receiveDate?.split('T')[0]}</div>
                  {selected.referenceCustomer && (
                    <div className="col-span-2">
                      Reference: {selected.referenceCustomer}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsCalendar;
