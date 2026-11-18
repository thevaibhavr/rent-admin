'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, EyeIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiService } from '@/services/api';
import type { VisitorActivityFilter, VisitorProfileRecord } from '@/types';
import WhatsAppIcon from '@/components/WhatsAppIcon';

const PAGE_SIZE = 20;

const ACTIVITY_FILTERS: Array<{ key: VisitorActivityFilter; label: string }> = [
  { key: 'all', label: 'All Visitors' },
  { key: 'last_7_days', label: 'Last Active (7 Days)' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last_15_days', label: 'Last 15 Days' },
  { key: 'not_visited_30', label: 'Not Visited (30+ Days)' },
];

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelative = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${months >= 24 ? 's' : ''} ago`;
};

function VisitorProfilesPage() {
  const [profiles, setProfiles] = useState<VisitorProfileRecord[]>([]);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<VisitorActivityFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [editingProfile, setEditingProfile] = useState<VisitorProfileRecord | null>(null);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', city: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<VisitorProfileRecord | null>(null);
  const [deletingProfile, setDeletingProfile] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await apiService.getVisitorProfiles({ page, limit: PAGE_SIZE, search });
        if (!active) return;
        setProfiles(result.profiles);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setPage(result.currentPage);
      } catch (loadError) {
        console.error('Unable to load visitor details:', loadError);
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load visitor details.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, search ? 300 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [page, refreshKey, search, activityFilter]);

  const startEditing = (profile: VisitorProfileRecord) => {
    setEditingProfile(profile);
    setEditForm({
      name: profile.name,
      mobile: profile.mobile.replace(/\D/g, '').slice(-10),
      city: profile.city,
    });
    setMutationError('');
    setNotice('');
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProfile) return;

    setSavingEdit(true);
    setMutationError('');
    setNotice('');
    try {
      const updatedProfile = await apiService.updateVisitorProfile(editingProfile.visitorId, editForm);
      setProfiles((currentProfiles) => currentProfiles.map((profile) =>
        profile.visitorId === updatedProfile.visitorId ? updatedProfile : profile,
      ));
      setEditingProfile(null);
      setNotice('Visitor details updated successfully.');
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (saveError) {
      console.error('Unable to update visitor details:', saveError);
      setMutationError(saveError instanceof Error ? saveError.message : 'Unable to update visitor details.');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteProfile = async () => {
    if (!profileToDelete) return;

    setDeletingProfile(true);
    setMutationError('');
    setNotice('');
    try {
      await apiService.deleteVisitorProfile(profileToDelete.visitorId);
      setProfiles((currentProfiles) => currentProfiles.filter(
        (profile) => profile.visitorId !== profileToDelete.visitorId,
      ));
      setTotal((currentTotal) => Math.max(0, currentTotal - 1));
      setProfileToDelete(null);
      setNotice('Visitor details deleted successfully.');
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (deleteError) {
      console.error('Unable to delete visitor details:', deleteError);
      setMutationError(deleteError instanceof Error ? deleteError.message : 'Unable to delete visitor details.');
    } finally {
      setDeletingProfile(false);
    }
  };

  const getInitials = (name: string) => {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
    return initials || '?';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Visitor Details</h1>
          <p className="mt-1 text-sm text-gray-500">Contact details submitted through the storefront prompt.</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, mobile, or village / city"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
            />
          </div>
          <p className="text-sm text-gray-600">Total profiles: <strong className="text-gray-900">{total.toLocaleString()}</strong></p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {ACTIVITY_FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setActivityFilter(option.key);
                setPage(1);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activityFilter === option.key
                  ? 'bg-[#b87570] text-white shadow-sm'
                  : 'bg-[#f7ede8] text-[#633b3b] hover:bg-[#f0ddd5]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7ede8] text-[#b87570]">
              <UserGroupIcon className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-900">No visitor details found</p>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or activity filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mobile</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Village / City</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Submitted</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Last Visit</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profiles.map((profile) => (
                  <tr key={profile.visitorId} className="transition-colors hover:bg-[#f7ede8]/40">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/visitor-profiles/${encodeURIComponent(profile.visitorId)}`}
                        className="group/name flex items-center gap-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7ede8] text-sm font-semibold text-[#633b3b]">
                          {getInitials(profile.name)}
                        </div>
                        <span className="font-medium text-gray-900 transition-colors group-hover/name:text-[#b87570]">
                          {profile.name}
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <a href={`tel:${profile.mobile}`} className="transition-colors hover:text-[#b87570]">{profile.mobile}</a>
                        <a
                          href={`https://wa.me/91${profile.mobile.replace(/\D/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open WhatsApp chat with ${profile.name}`}
                          title="Chat on WhatsApp"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                        </a>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">{profile.city}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">{new Date(profile.createdAt).toLocaleString('en-IN')}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {profile.lastSeen ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{formatRelative(profile.lastSeen)}</span>
                          <span className="text-xs text-gray-500">{formatDateTime(profile.lastSeen)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No activity yet</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/visitor-profiles/${encodeURIComponent(profile.visitorId)}`}
                          aria-label={`View activity for ${profile.name}`}
                          title="View visitor activity"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#f7ede8] hover:text-[#b87570]"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEditing(profile)}
                          aria-label={`Edit ${profile.name}`}
                          title="Edit visitor details"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#f7ede8] hover:text-[#b87570]"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileToDelete(profile);
                            setMutationError('');
                            setNotice('');
                          }}
                          aria-label={`Delete ${profile.name}`}
                          title="Delete visitor details"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>

      {editingProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-visitor-title"
          onClick={() => !savingEdit && setEditingProfile(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 id="edit-visitor-title" className="text-lg font-semibold text-gray-900">Edit visitor details</h2>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                disabled={savingEdit}
                aria-label="Close edit form"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveProfile} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <label className="block text-sm font-medium text-gray-700">
                  Name
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    value={editForm.name}
                    onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Mobile number
                  <div className="mt-1 flex items-center overflow-hidden rounded-xl border border-gray-200 focus-within:border-[#b87570] focus-within:ring-2 focus-within:ring-[#b87570]/30">
                    <span className="border-r border-gray-200 px-3 py-2.5 text-sm text-gray-500">+91</span>
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editForm.mobile}
                      onChange={(event) => setEditForm((current) => ({
                        ...current,
                        mobile: event.target.value.replace(/\D/g, '').slice(-10),
                      }))}
                      className="block w-full border-0 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-0"
                    />
                  </div>
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Village / City
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={editForm.city}
                    onChange={(event) => setEditForm((current) => ({ ...current, city: event.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
                  />
                </label>
                {mutationError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{mutationError}</p>}
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#b87570] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a5655f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingEdit ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profileToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-visitor-title"
          onClick={() => !deletingProfile && setProfileToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 sm:p-6"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 id="delete-visitor-title" className="text-lg font-semibold text-gray-900">Delete visitor details?</h2>
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                disabled={deletingProfile}
                aria-label="Close"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <p className="text-sm text-gray-600">
                This will permanently delete the details for <strong>{profileToDelete.name}</strong>.
              </p>
              {mutationError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{mutationError}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                disabled={deletingProfile}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteProfile}
                disabled={deletingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingProfile ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VisitorProfilesPageWrapper() {
  return (
    <ProtectedRoute>
      <VisitorProfilesPage />
    </ProtectedRoute>
  );
}
