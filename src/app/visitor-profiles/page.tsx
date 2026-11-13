'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ArrowPathIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiService } from '@/services/api';
import type { VisitorProfileRecord } from '@/types';
import WhatsAppIcon from '@/components/WhatsAppIcon';

const PAGE_SIZE = 20;

function VisitorProfilesPage() {
  const [profiles, setProfiles] = useState<VisitorProfileRecord[]>([]);
  const [search, setSearch] = useState('');
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
  }, [page, refreshKey, search]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Visitor Details</h1>
          <p className="mt-1 text-sm text-gray-500">Contact details submitted through the storefront prompt.</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
          className="inline-flex items-center gap-2 self-start rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:self-auto"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="w-full sm:max-w-md">
            <span className="sr-only">Search by name, mobile, or city</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, mobile, or village / city"
              className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </label>
          <p className="text-sm text-gray-600">Total profiles: <strong className="text-gray-900">{total.toLocaleString()}</strong></p>
        </div>
      </section>

      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading visitor details...</div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No visitor details found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Mobile</th>
                  <th className="px-5 py-3">Village / City</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((profile) => (
                  <tr key={profile.visitorId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{profile.name}</td>
                    <td className="px-5 py-3 text-gray-600">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <a href={`tel:${profile.mobile}`} className="hover:text-indigo-600">{profile.mobile}</a>
                        <a
                          href={`https://wa.me/91${profile.mobile.replace(/\D/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open WhatsApp chat with ${profile.name}`}
                          title="Chat on WhatsApp"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 transition hover:bg-green-100"
                        >
                          <WhatsAppIcon className="h-5 w-5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{profile.city}</td>
                    <td className="px-5 py-3 text-gray-600">{new Date(profile.createdAt).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(profile)}
                          aria-label={`Edit ${profile.name}`}
                          title="Edit visitor details"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50"
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
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
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

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-sm text-gray-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {editingProfile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-visitor-title"
          onClick={() => !savingEdit && setEditingProfile(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
        >
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="edit-visitor-title" className="text-lg font-semibold text-gray-900">Edit visitor details</h2>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                disabled={savingEdit}
                aria-label="Close edit form"
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Name
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={editForm.name}
                  onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Mobile number
                <div className="mt-1 flex items-center rounded-md border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                  <span className="border-r border-gray-300 px-3 py-2 text-sm text-gray-500">+91</span>
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editForm.mobile}
                    onChange={(event) => setEditForm((current) => ({
                      ...current,
                      mobile: event.target.value.replace(/\D/g, '').slice(-10),
                    }))}
                    className="block w-full border-0 text-sm shadow-none focus:ring-0"
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
                  className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>
              {mutationError && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{mutationError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  disabled={savingEdit}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
        >
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 id="delete-visitor-title" className="text-lg font-semibold text-gray-900">Delete visitor details?</h2>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently delete the details for <strong>{profileToDelete.name}</strong>.
            </p>
            {mutationError && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{mutationError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                disabled={deletingProfile}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteProfile}
                disabled={deletingProfile}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
