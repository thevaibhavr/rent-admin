"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import type { Event } from 'react-big-calendar';
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
    const isCompleted = booking.status === 'completed';
    
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
      title: `${booking.customer.name} - ${dressName}${isCanceled ? ' (Canceled)' : isCompleted ? ' (Completed)' : ''}`,
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

      // Trigger dashboard refresh
      localStorage.setItem('dashboardRefreshNeeded', Date.now().toString());
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

      // Trigger dashboard refresh
      localStorage.setItem('dashboardRefreshNeeded', Date.now().toString());

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

      // Trigger dashboard refresh
      localStorage.setItem('dashboardRefreshNeeded', Date.now().toString());

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
      <div className="bg-white rounded-lg ">
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
              position: relative !important;
              flex-shrink: 0 !important;
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
              min-height: 35px;
              min-width: 35px;
              max-height: 40px;
              max-width: 40px;
              height: 35px;
              width: 35px;
            }
            .rbc-month-view .rbc-event-content {
              min-height: 35px;
              min-width: 35px;
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
            /* Stack multiple events in month view */
            .rbc-month-view .rbc-date-cell .rbc-events-container {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              align-items: flex-start;
              justify-content: flex-start;
            }
            .rbc-month-view .rbc-date-cell {
              position: relative;
            }
            .rbc-month-view .rbc-day-bg {
              position: relative;
            }
            /* Ensure multiple events are visible in month view cells */
            .rbc-month-row {
              min-height: 120px;
            }
            .rbc-day-bg + .rbc-events-container {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              padding: 2px;
            }
            /* Container for events in month view date cells */
            .rbc-date-cell {
              position: relative;
            }
            .rbc-date-cell > div {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              align-items: flex-start;
            }
            /* Ensure events container in month view allows wrapping */
            .rbc-month-view .rbc-date-cell .rbc-events-container,
            .rbc-month-view .rbc-date-cell > div:not(.rbc-day-bg) {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 4px !important;
              align-items: flex-start !important;
              justify-content: flex-start !important;
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
            /* Popup styling for "+X more" events */
            .rbc-overlay {
              position: fixed !important;
              z-index: 9999 !important;
              background: white !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 8px !important;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
              padding: 16px !important;
              max-width: 450px !important;
              width: calc(100vw - 32px) !important;
              max-height: 85vh !important;
              overflow-y: auto !important;
              overflow-x: hidden !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              margin: 16px !important;
            }
            @media (min-width: 640px) {
              .rbc-overlay {
                width: 90vw !important;
                max-width: 450px !important;
              }
            }
            .rbc-overlay-header {
              font-weight: 600 !important;
              font-size: 1rem !important;
              margin-bottom: 12px !important;
              padding-bottom: 12px !important;
              border-bottom: 2px solid #e5e7eb !important;
              color: #000000 !important;
            }
            .rbc-overlay-event {
              padding: 8px !important;
              margin-bottom: 6px !important;
              border-radius: 6px !important;
              cursor: pointer !important;
              transition: all 0.2s !important;
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              border: 1px solid transparent !important;
            }
            .rbc-overlay-event:hover {
              background-color: #f3f4f6 !important;
              border-color: #e5e7eb !important;
            }
            .rbc-overlay-event:last-child {
              margin-bottom: 0 !important;
            }
            /* Style event images in popup */
            .rbc-overlay-event .rbc-event-content {
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              padding: 0 !important;
            }
            .rbc-overlay-event .rbc-event-content img {
              width: 42px !important;
              height: 42px !important;
              min-width: 42px !important;
              min-height: 42px !important;
              max-width: 42px !important;
              max-height: 42px !important;
              border-radius: 50% !important;
              object-fit: cover !important;
              border: 2px solid #fff !important;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
              flex-shrink: 0 !important;
            }
            /* Ensure popup events don't have circular constraints */
            .rbc-overlay .rbc-event {
              border-radius: 8px !important;
              height: auto !important;
              min-height: auto !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 0 8px 0 !important;
              display: flex !important;
              align-items: center !important;
            }
            /* Override any image sizing in popup events */
            .rbc-overlay .rbc-event img {
              width: 60px !important;
              height: 60px !important;
              min-width: 60px !important;
              min-height: 60px !important;
              max-width: 60px !important;
              max-height: 60px !important;
            }
            /* Ensure event content wrapper doesn't force image size */
            .rbc-overlay .rbc-event .rbc-event-content {
              width: auto !important;
              height: auto !important;
              min-width: auto !important;
              min-height: auto !important;
            }
            .rbc-overlay .rbc-event:last-child {
              margin-bottom: 0 !important;
            }
            /* Style event text in popup */
            .rbc-overlay .rbc-event-label {
              display: none !important;
            }
            .rbc-overlay .rbc-event-content {
              white-space: normal !important;
              overflow: visible !important;
              text-overflow: clip !important;
            }
            /* Ensure event titles are visible in popup */
            .rbc-overlay-event .rbc-event-content::after {
              content: attr(title) !important;
              margin-left: 12px !important;
              color: #000000 !important;
              font-size: 0.875rem !important;
              flex: 1 !important;
            }
            /* Add backdrop overlay */
            .rbc-overlay-backdrop {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              background-color: rgba(0, 0, 0, 0.5) !important;
              z-index: 9998 !important;
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
                const isCompleted = event.resource.status === 'completed';
                
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
                  isCanceled ? 'Status: Canceled' : isCompleted ? 'Status: Completed' : 'Status: Active'
                ].filter(Boolean).join('\n');
                
                return (
                  <div 
                    title={tooltip}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleSelectEvent(event);
                    }}
                    className={`rbc-event-content cursor-pointer overflow-hidden ${isCanceled ? 'opacity-60' : ''} ${isCompleted ? 'ring-2 ring-green-500 ring-offset-2' : ''} hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 transition-all`}
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
                        {isCompleted && (
                          <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center rounded-full">
                            <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded-full">✓</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-xs p-1 rounded-full ${isCanceled ? 'bg-red-500/70' : isCompleted ? 'bg-green-500/70' : 'bg-indigo-500'} text-white font-medium`} style={{ borderRadius: '50%' }}>
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
                    style={{ 
                      ...props.style, 
                      padding: 0, 
                      margin: '2px',
                      position: 'relative',
                      display: 'inline-block',
                      verticalAlign: 'top'
                    }}
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
                {selected.status === 'completed' && (
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    ✓ Payment Completed
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
              <div className="space-y-6">
                {/* Customer Information Section */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Customer Information
                    </h4>
                      {selected.customer.image && (
                      <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                          <Image
                            src={selected.customer.image}
                            alt="Customer"
                            fill
                          className="object-cover"
                          />
                        </div>
                      )}
                    </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Name:</span>
                        <span className="text-sm font-semibold text-gray-900">{selected.customer.name}</span>
                  </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Mobile:</span>
                        <span className="text-sm text-gray-900">{selected.customer.mobile || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <span className="text-sm text-gray-900">{selected.customer.email || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Location:</span>
                        <span className="text-sm text-gray-900">{selected.customer.location || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Reference:</span>
                        <span className="text-sm text-gray-900">{selected.referenceCustomer || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Created:</span>
                        <span className="text-sm text-gray-900">
                          {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  {selected.customer.emergencyContact && (selected.customer.emergencyContact.name || selected.customer.emergencyContact.phone) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</h5>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{selected.customer.emergencyContact.name || 'N/A'}</span>
                        <span className="text-sm text-gray-900">{selected.customer.emergencyContact.phone || 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  {/* Body Measurements */}
                  {selected.customer.measurements && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Body Measurements</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        {selected.customer.measurements.bust && (
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{selected.customer.measurements.bust}cm</div>
                            <div className="text-gray-600">Bust</div>
                    </div>
                        )}
                        {selected.customer.measurements.waist && (
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{selected.customer.measurements.waist}cm</div>
                            <div className="text-gray-600">Waist</div>
                          </div>
                        )}
                        {selected.customer.measurements.hips && (
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{selected.customer.measurements.hips}cm</div>
                            <div className="text-gray-600">Hips</div>
                          </div>
                        )}
                        {selected.customer.measurements.shoulder && (
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{selected.customer.measurements.shoulder}cm</div>
                            <div className="text-gray-600">Shoulder</div>
                          </div>
                        )}
                        {selected.customer.measurements.length && (
                          <div className="text-center">
                            <div className="font-medium text-gray-900">{selected.customer.measurements.length}cm</div>
                            <div className="text-gray-600">Length</div>
                          </div>
                        )}
                      </div>
                      {selected.customer.measurements.size && (
                        <div className="mt-2 text-center">
                          <span className="text-sm font-medium text-purple-600">Size: {selected.customer.measurements.size}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                    Financial Summary
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">Total Earnings</div>
                      <div className="text-2xl font-bold text-green-600">
                        ₹{(selected.totalPaid || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">Total Expenses</div>
                      <div className="text-2xl font-bold text-red-600">
                        ₹{(selected.items?.reduce((total, item) =>
                          total + (item.transportCost || 0) + (item.dryCleaningCost || 0) +
                          (item.repairCost || 0) + (item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0), 0) || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">Net Profit</div>
                      <div className={`text-2xl font-bold ${
                        ((selected.totalPaid || 0) - (selected.items?.reduce((total, item) =>
                          total + (item.transportCost || 0) + (item.dryCleaningCost || 0) +
                          (item.repairCost || 0) + (item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0), 0) || 0)) >= 0
                        ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₹{(((selected.totalPaid || 0) - (selected.items?.reduce((total, item) =>
                          total + (item.transportCost || 0) + (item.dryCleaningCost || 0) +
                          (item.repairCost || 0) + (item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0), 0) || 0))).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Price:</span>
                      <span className="font-semibold">₹{(selected.totalPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance:</span>
                      <span className="font-semibold">₹{(selected.totalAdvance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending:</span>
                      <span className="font-semibold">₹{(selected.totalPending || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security:</span>
                      <span className="font-semibold">₹{(selected.totalSecurity || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Booking Items */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Booking Items ({selected.items?.length || 0})
                  </h4>

                  <div className="space-y-4">
                    {selected.items && selected.items.length > 0 ? (
                      selected.items.map((item, index) => {
                        const dressName = typeof item.dressId === 'object' && item.dressId?.name
                          ? item.dressId.name
                          : 'N/A';
                        const dressIdObj = typeof item.dressId === 'object' ? item.dressId : null;

                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900">{dressName}</h5>
                                  {dressIdObj?.brand && (
                                    <p className="text-sm text-gray-600">{dressIdObj.brand}</p>
                                  )}
                                </div>
                              </div>

                              {item.dressImage && (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                                  <Image
                                    src={item.dressImage}
                                    alt="Dress"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Pricing Information */}
                              <div className="space-y-2">
                                <h6 className="text-sm font-medium text-gray-700">Pricing</h6>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Original:</span>
                                    <span className="font-medium">₹{(item.originalPrice || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">After Bargain:</span>
                                    <span className="font-medium text-green-600">₹{(item.priceAfterBargain || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Discount:</span>
                                    <span className="font-medium text-blue-600">₹{(item.discount || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Payment Status */}
                              <div className="space-y-2">
                                <h6 className="text-sm font-medium text-gray-700">Payment</h6>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Advance:</span>
                                    <span className="font-medium">₹{(item.advance || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Pending:</span>
                                    <span className={`font-medium ${(item.pending || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      ₹{(item.pending || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Security:</span>
                                    <span className="font-medium">₹{(item.securityAmount || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Timeline & Usage */}
                              <div className="space-y-2">
                                <h6 className="text-sm font-medium text-gray-700">Timeline</h6>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Booked:</span>
                                    <span className="font-medium">
                                      {item.bookingDate ? new Date(item.bookingDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Sent:</span>
                                    <span className="font-medium">
                                      {item.sendDate ? new Date(item.sendDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Received:</span>
                                    <span className="font-medium">
                                      {item.receiveDate ? new Date(item.receiveDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </div>
                                </div>

                                {item.useDress && (
                                  <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                                    <div className="font-medium text-purple-800">{item.useDress}</div>
                                    {item.useDressDate && (
                                      <div className="text-purple-600">
                                        {new Date(item.useDressDate).toLocaleDateString()}
                                        {item.useDressTime && ` • ${item.useDressTime}`}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Operational Costs */}
                            {(item.transportCost || item.dryCleaningCost || item.repairCost || item.additionalCosts?.length) && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h6 className="text-sm font-medium text-gray-700 mb-2">Operational Costs</h6>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  {item.transportCost && item.transportCost > 0 && (
                                    <div className="bg-blue-50 p-2 rounded">
                                      <div className="text-blue-800 font-medium">Transport</div>
                                      <div className="text-blue-600">₹{item.transportCost.toLocaleString()}</div>
                                    </div>
                                  )}
                                  {item.dryCleaningCost && item.dryCleaningCost > 0 && (
                                    <div className="bg-yellow-50 p-2 rounded">
                                      <div className="text-yellow-800 font-medium">Dry Cleaning</div>
                                      <div className="text-yellow-600">₹{item.dryCleaningCost.toLocaleString()}</div>
                                    </div>
                                  )}
                                  {item.repairCost && item.repairCost > 0 && (
                                    <div className="bg-red-50 p-2 rounded">
                                      <div className="text-red-800 font-medium">Repair</div>
                                      <div className="text-red-600">₹{item.repairCost.toLocaleString()}</div>
                                    </div>
                                  )}
                                </div>

                                {item.additionalCosts && item.additionalCosts.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-xs font-medium text-gray-700 mb-1">Additional Costs:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {item.additionalCosts.map((cost, costIndex) => (
                                        <span key={costIndex} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                          {cost.reason}: ₹{cost.amount?.toLocaleString() || 0}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
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

                {/* Booking Details */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Booking Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Booking ID:</span>
                        <span className="text-sm font-mono text-gray-900">{selected.bookingId || selected._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                        <span className="text-sm text-gray-900">{selected.paymentMethod || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Rental Duration:</span>
                        <span className="text-sm text-gray-900">{selected.rentalDuration ? `${selected.rentalDuration} days` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Return Deadline:</span>
                        <span className="text-sm text-gray-900">
                          {selected.returnDeadline ? new Date(selected.returnDeadline).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Created:</span>
                        <span className="text-sm text-gray-900">
                          {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Updated:</span>
                        <span className="text-sm text-gray-900">
                          {selected.updatedAt ? new Date(selected.updatedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {selected.deliveryAddress && (
                        <div className="col-span-1 md:col-span-2">
                          <span className="text-sm font-medium text-gray-600">Delivery Address:</span>
                          <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">{selected.deliveryAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selected.specialInstructions && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-600">Special Instructions:</span>
                      <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">{selected.specialInstructions}</p>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                {(selected.adminNotes || selected.customerNotes) && (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Notes
                    </h4>

                    <div className="space-y-4">
                      {selected.adminNotes && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Admin Notes</h5>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">{selected.adminNotes}</p>
                          </div>
                        </div>
                      )}

                      {selected.customerNotes && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Customer Notes</h5>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">{selected.customerNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
