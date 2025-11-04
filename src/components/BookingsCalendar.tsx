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
  itemIndex?: number;
  dressImage?: string;
  eventType?: 'use' | 'send' | 'receive';
  allDay?: boolean;
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
      console.log('Fetched bookings:', res);
      setBookings(res.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Convert bookings to calendar events - one event per item
  const events: CalendarEvent[] = [];
  
  bookings.forEach(booking => {
    const isCanceled = booking.status === 'canceled';
    
    // Handle new structure with items array
    if (booking.items && booking.items.length > 0) {
      booking.items.forEach((item, itemIndex) => {
        // Only show events where dress is going to be used (useDressDate)
        // Skip items without useDressDate
        if (!item.useDressDate) {
          return;
        }
        
        // Use the date when dress will be used
        const startDate = new Date(item.useDressDate);
        if (isNaN(startDate.getTime())) {
          return;
        }
        startDate.setHours(0, 0, 0, 0);
        
        // Single day event - same day for start and end
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        
        // Get dress name and image from item
        let dressName = 'Dress';
        let dressImage = item.dressImage || '';
        
        if (typeof item.dressId === 'object' && item.dressId?.name) {
          dressName = item.dressId.name;
          // If no dressImage from item, try to get from dressId object
          if (!dressImage && item.dressId.images && item.dressId.images.length > 0) {
            dressImage = item.dressId.images[0];
          }
        } else if (typeof item.dressId === 'string') {
          dressName = 'Dress';
        }
        
        events.push({
          id: `${booking._id}-item-${itemIndex}`,
      title: `${booking.customer.name} - ${dressName}${isCanceled ? ' (Canceled)' : ''}`,
      start: startDate,
      end: endDate,
      resource: booking,
          itemIndex: itemIndex,
          dressImage: dressImage,
      allDay: true
        });
      });
    }
    // Note: Legacy single-item bookings are skipped - only show items with useDressDate
  });

  const handleSelectEvent = (event: Event | CalendarEvent) => {
    const calendarEvent = event as unknown as CalendarEvent;
    setSelected(calendarEvent.resource);
    setIsEditing(false);
  };

  const handleEditSave = async (updatedBooking: Partial<Booking>) => {
    try {
      // Clean the booking data to remove immutable fields
      const cleanData: Record<string, unknown> = { ...updatedBooking };
      delete cleanData._id;
      delete cleanData.__v;
      delete cleanData.bookingId;
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      
      // Clean items array if present
      if (cleanData.items && Array.isArray(cleanData.items)) {
        cleanData.items = cleanData.items.map((item: Record<string, unknown>) => {
          const cleanItem = { ...item };
          delete cleanItem._id;
          return cleanItem;
        });
      }
      
      await apiService.updateBooking(selected!._id, cleanData as Partial<Booking>);
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
              background-color: transparent !important;
              border: none !important;
              border-radius: 50% !important;
              padding: 0 !important;
              margin: 2px !important;
              font-size: 0.875rem !important;
              color: #000000 !important;
              box-shadow: none !important;
            }
            .rbc-event-content {
              padding: 0 !important;
              height: 100% !important;
              width: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .rbc-event-content img {
              object-fit: cover;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              border: 2px solid #fff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .rbc-month-view .rbc-event {
              min-height: 60px;
              min-width: 60px;
              max-height: 80px;
              max-width: 80px;
              height: 60px;
              width: 60px;
            }
            .rbc-month-view .rbc-event-content {
              min-height: 60px;
              min-width: 60px;
              height: 100%;
              width: 100%;
            }
            .rbc-day-slot .rbc-event {
              min-height: 50px;
              min-width: 50px;
              max-height: 60px;
              max-width: 60px;
              height: 50px;
              width: 50px;
            }
            .rbc-day-slot .rbc-event-content {
              min-height: 50px;
              min-width: 50px;
            }
            .rbc-time-view .rbc-event {
              min-height: 50px;
              min-width: 50px;
            }
            /* Stack multiple events on same day */
            .rbc-day-slot .rbc-events-container {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              align-items: flex-start;
            }
            /* Remove default event styling */
            .rbc-event-label {
              display: none !important;
            }
            .rbc-event.rbc-selected {
              box-shadow: 0 0 0 3px #4f46e5 !important;
            }
            .rbc-event.canceled {
              opacity: 0.6;
            }
            .rbc-event.rbc-selected {
              box-shadow: 0 0 0 3px #4f46e5 !important;
            }
            .rbc-day-slot .rbc-event {
              border: none !important;
              color: #000000 !important;
            }
            /* Remove borders from all event elements */
            .rbc-event-label,
            .rbc-event-content,
            .rbc-event {
              border: none !important;
              outline: none !important;
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
              event: (props: React.HTMLAttributes<HTMLDivElement> & { event: Event }) => {
                const event = props.event as unknown as CalendarEvent;
                if (!event || !event.resource) {
                  return <div {...props} />;
                }
                
                const isCanceled = event.resource.status === 'canceled';
                
                // Get dress image from event
                const dressImage = event.dressImage;
                
                // Get customer name for tooltip
                const customerName = event.resource.customer?.name || 'Customer';
                
                // Get dress name for tooltip
                let dressName = 'Dress';
                if (event.itemIndex !== undefined && event.resource.items && event.resource.items[event.itemIndex]) {
                  const item = event.resource.items[event.itemIndex];
                  if (typeof item.dressId === 'object' && item.dressId?.name) {
                    dressName = item.dressId.name;
                  }
                } else if (typeof (event.resource as unknown as { dressId?: { name?: string } }).dressId === 'object') {
                  dressName = (event.resource as unknown as { dressId?: { name?: string } }).dressId?.name || 'Dress';
                }
                
                        // Get use dress info for tooltip
                let useDateInfo = '';
                if (event.itemIndex !== undefined && event.resource.items && event.resource.items[event.itemIndex]) {
                  const item = event.resource.items[event.itemIndex];
                  if (item.useDressDate) {
                    const useDate = new Date(item.useDressDate);
                    useDateInfo = `Use Date: ${format(useDate, 'MMM d, yyyy')}`;
                    if (item.useDressTime) {
                      useDateInfo += ` (${item.useDressTime})`;
                    }
                  }
                }
                
                const tooltip = [
                  `${customerName} - ${dressName}`,
                  useDateInfo || `Send: ${format(event.start, 'MMM d, yyyy')}`,
                  !useDateInfo && `Return: ${format(event.end, 'MMM d, yyyy')}`,
                  isCanceled ? 'Status: Canceled' : ''
                ].filter(Boolean).join('\n');
                
                return (
                  <div 
                    title={tooltip}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleSelectEvent(event);
                    }}
                    className={`rbc-event-content cursor-pointer overflow-hidden ${isCanceled ? 'opacity-60' : ''} hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 transition-all`}
                    style={{ 
                      height: '100%', 
                      width: '100%',
                      borderRadius: '50%',
                      flexShrink: 0,
                      padding: 0,
                      margin: 0
                    }}
                  >
                    {dressImage ? (
                      <div className="relative w-full h-full" style={{ borderRadius: '50%', overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={dressImage}
                          alt={dressName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #4f46e5; color: white; font-size: 0.6rem; padding: 4px; border-radius: 50%; text-align: center; word-break: break-word;">
                                  ${dressName.substring(0, 10)}
                                </div>
                              `;
                            }
                          }}
                        />
                        {isCanceled && (
                          <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center rounded-full">
                            <span className="text-xs font-bold text-white bg-red-600 px-2 py-1 rounded-full">✕</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-xs p-1 rounded-full ${isCanceled ? 'bg-red-500/70' : 'bg-indigo-500'} text-white font-medium`} style={{ borderRadius: '50%' }}>
                        {dressName.substring(0, 10)}
                      </div>
                    )}
                  </div>
                );
              },
              eventWrapper: (props: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => {
                return (
                  <div 
                    {...props}
                    style={{ ...props.style, padding: 0, margin: '1px' }}
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
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium mb-2 text-black">Customer Details</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-black">Name: {selected.customer.name}</div>
                      <div className="text-sm text-black">Mobile: {selected.customer.mobile || 'N/A'}</div>
                      <div className="text-sm text-black">Location: {selected.customer.location || 'N/A'}</div>
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
                  <div>
                    <h4 className="font-medium mb-2 text-black">Booking Summary</h4>
                    <div className="space-y-2 text-sm text-black">
                      <div>Booking ID: {selected.bookingId || selected._id}</div>
                      <div>Total Price: ₹{selected.totalPrice || 0}</div>
                      <div>Total Advance: ₹{selected.totalAdvance || 0}</div>
                      <div>Total Pending: ₹{selected.totalPending || 0}</div>
                      <div>Total Security: ₹{selected.totalSecurity || 0}</div>
                      {selected.referenceCustomer && (
                        <div>Reference: {selected.referenceCustomer}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Booking Items */}
                <div className="mt-6">
                  <h4 className="font-medium mb-4 text-black">Booking Items ({selected.items?.length || 0})</h4>
                  <div className="space-y-4">
                    {selected.items && selected.items.length > 0 ? (
                      selected.items.map((item, index) => {
                        const dressName = typeof item.dressId === 'object' && item.dressId?.name 
                          ? item.dressId.name 
                          : 'N/A';
                        const dressIdObj = typeof item.dressId === 'object' ? item.dressId : null;
                        
                        return (
                          <div key={index} className="border border-gray-300 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium text-black mb-2">Item {index + 1}: {dressName}</div>
                                {item.dressImage && (
                                  <div className="relative h-32 w-full">
                                    <Image
                                      src={item.dressImage}
                                      alt="Dress"
                                      fill
                                      className="object-cover rounded"
                                    />
                                  </div>
                                )}
                                {dressIdObj && (
                                  <div className="text-xs text-gray-600 mt-2">
                                    <div>Brand: {dressIdObj.brand || 'N/A'}</div>
                                    <div>Price: ₹{dressIdObj.price || 'N/A'}</div>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2 text-sm text-black">
                                <div>Price After Bargain: ₹{item.priceAfterBargain || 0}</div>
                                <div>Advance: ₹{item.advance || 0}</div>
                                <div>Pending: ₹{item.pending || 0}</div>
                                <div>Security: ₹{item.securityAmount || 0}</div>
                                <div>Send Date: {item.sendDate ? new Date(item.sendDate).toLocaleDateString() : 'N/A'}</div>
                                <div>Receive Date: {item.receiveDate ? new Date(item.receiveDate).toLocaleDateString() : 'N/A'}</div>
                                {item.useDress && (
                                  <div className="text-blue-600 font-medium">Use: {item.useDress}</div>
                                )}
                                {item.useDressDate && (
                                  <div className="text-purple-600 font-medium">
                                    Use Date: {new Date(item.useDressDate).toLocaleDateString()}
                                    {item.useDressTime && ` (${item.useDressTime})`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Legacy single-item support
                      <div className="border border-gray-300 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-black mb-2">
                              {(selected as unknown as { dressId?: { name?: string } }).dressId?.name || 'N/A'}
                            </div>
                            {selected.dressImage && (
                              <div className="relative h-32 w-full">
                                <Image
                                  src={selected.dressImage}
                                  alt="Dress"
                                  fill
                                  className="object-cover rounded"
                                />
                    </div>
                  )}
                          </div>
                          <div className="space-y-2 text-sm text-black">
                            <div>Price: ₹{selected.priceAfterBargain || 0}</div>
                            <div>Advance: ₹{selected.advance || 0}</div>
                            <div>Pending: ₹{selected.pending || 0}</div>
                            <div>Security: ₹{selected.securityAmount || 0}</div>
                            <div>Send Date: {selected.sendDate?.split('T')[0] || 'N/A'}</div>
                            <div>Receive Date: {selected.receiveDate?.split('T')[0] || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                {selected.status === 'canceled' && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-black">
                      <div className="font-medium text-red-600 mb-2">Status: Canceled</div>
                      {selected.canceledAt && (
                        <div>Canceled At: {new Date(selected.canceledAt).toLocaleString()}</div>
                      )}
                      {selected.cancelReason && (
                        <div>Cancel Reason: {selected.cancelReason}</div>
                      )}
                    </div>
                  </div>
                  )}
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
