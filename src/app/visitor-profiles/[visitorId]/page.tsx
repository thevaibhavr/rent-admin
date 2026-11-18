'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  PhoneIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  MagnifyingGlassIcon,
  TagIcon,
  FireIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { apiService } from '@/services/api';
import type { VisitorActivityRange, VisitorActivityTimelineItem, VisitorProfileDetail } from '@/types';

const RANGE_OPTIONS: Array<{ key: VisitorActivityRange; label: string }> = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: 'Last 7 days' },
  { key: '15d', label: 'Last 15 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'custom', label: 'Custom' },
];

const TIMELINE_ICON: Record<VisitorActivityTimelineItem['type'], typeof EyeIcon> = {
  product_view: EyeIcon,
  product_click: CursorArrowRaysIcon,
  category_click: TagIcon,
  search: MagnifyingGlassIcon,
};

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const num = (value: number) => (value || 0).toLocaleString('en-IN');

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelative = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
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

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(-10);

const getInitials = (name: string) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return initials || '?';
};

function VisitorProfileDetailPage() {
  const params = useParams();
  const visitorId = Array.isArray(params?.visitorId) ? params?.visitorId[0] : params?.visitorId || '';

  const [detail, setDetail] = useState<VisitorProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<VisitorActivityRange>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    if (!visitorId) return;
    if (range === 'custom' && (!customStart || !customEnd)) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await apiService.getVisitorProfileDetail(
          visitorId,
          range === 'custom' ? { range, startDate: customStart, endDate: customEnd } : { range },
        );
        if (active) setDetail(result);
      } catch (loadError) {
        console.error('Unable to load visitor activity:', loadError);
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load visitor activity.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [visitorId, range, customStart, customEnd]);

  const selectRange = (key: VisitorActivityRange) => {
    setRange(key);
    if (key === 'custom' && (!customStart || !customEnd)) {
      const end = new Date();
      const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
      setCustomStart(toInputDate(start));
      setCustomEnd(toInputDate(end));
    }
  };

  if (loading && !detail) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-44 animate-pulse rounded-2xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-6">
        <Link
          href="/visitor-profiles"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#b87570]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to visitor details
        </Link>
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700">
          {error || 'Visitor profile not found.'}
        </div>
      </div>
    );
  }

  const { profile, summary, dresses, categories, searches, timeline } = detail;
  const whatsappNumber = `91${digitsOnly(profile.mobile)}`;

  const interestedCategories = categories.slice(0, 8);
  const searchIntent = searches.slice(0, 8);
  const topPicks = dresses.filter((dress) => dress.views > 0).slice(0, 3);

  const stats = [
    { label: 'Dresses viewed', value: num(summary.uniqueDresses), icon: EyeIcon },
    { label: 'Total views', value: num(summary.totalViews), icon: ChartBarIcon },
    { label: 'Searches', value: num(summary.totalSearches), icon: MagnifyingGlassIcon },
    { label: 'Category clicks', value: num(summary.totalCategoryClicks), icon: TagIcon },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/visitor-profiles"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#b87570]"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to visitor details
      </Link>

      {/* Activity time filter */}
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CalendarDaysIcon className="h-4 w-4 text-[#b87570]" />
            Activity period
            {loading && <span className="text-xs font-normal text-gray-400">Updating…</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => selectRange(option.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  range === option.key
                    ? 'bg-[#b87570] text-white shadow-sm'
                    : 'bg-[#f7ede8] text-[#633b3b] hover:bg-[#f0ddd5]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {range === 'custom' && (
          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-3">
            <label className="text-xs font-medium text-gray-600">
              From
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(event) => setCustomStart(event.target.value)}
                className="mt-1 block rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
              />
            </label>
            <label className="text-xs font-medium text-gray-600">
              To
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="mt-1 block rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#b87570] focus:outline-none focus:ring-2 focus:ring-[#b87570]/30"
              />
            </label>
          </div>
        )}
      </section>

      {/* Profile header */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#302628] via-[#3a2d2f] to-[#211b1d] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#b87570] text-xl font-semibold text-white shadow-lg shadow-black/30">
              {getInitials(profile.name)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4 text-white/50" />
                  {profile.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PhoneIcon className="h-4 w-4 text-white/50" />
                  {profile.mobile}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4 text-white/50" />
                  Last active {formatRelative(summary.lastSeen)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Chat on WhatsApp
            </a>
            <a
              href={`tel:${profile.mobile}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              <PhoneIcon className="h-4 w-4" />
              Call
            </a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 text-sm sm:grid-cols-3">
          <div className="inline-flex items-center gap-2 text-white/60">
            <CalendarDaysIcon className="h-4 w-4 text-white/40" />
            <span>Joined {formatDateTime(profile.createdAt)}</span>
          </div>
          <div className="inline-flex items-center gap-2 text-white/60">
            <SparklesIcon className="h-4 w-4 text-white/40" />
            <span>First seen {formatRelative(summary.firstSeen)}</span>
          </div>
          <div className="inline-flex items-center gap-2 text-white/60">
            <UserGroupIcon className="h-4 w-4 text-white/40" />
            <span>Active on {num(summary.activeDays)} day{summary.activeDays === 1 ? '' : 's'}</span>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7ede8] text-[#b87570]">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="mt-0.5 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Recent activity timeline */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-[#b87570]" />
              <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">Exact time of every view, open, search and category click.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {num(timeline.length)}
          </span>
        </div>
        {timeline.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No activity in this period.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {timeline.map((item, index) => {
              const Icon = TIMELINE_ICON[item.type];
              return (
                <li key={`${item.createdAt}-${index}`} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7ede8] text-[#b87570]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.label}</p>
                    {item.detail && <p className="text-xs text-gray-400">{item.detail}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-gray-700">{formatRelative(item.createdAt)}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(item.createdAt)}</p>
                  </div>
                  {item.detailUrl && (
                    <a
                      href={item.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open on storefront"
                      title="Open on storefront"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#f7ede8] hover:text-[#b87570]"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Interests */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <FireIcon className="h-5 w-5 text-[#b87570]" />
          <h2 className="text-lg font-semibold text-gray-900">What they are interested in</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">Derived from their views, category clicks and searches.</p>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Interested categories</h3>
            {interestedCategories.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">No category activity yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {interestedCategories.map((category) => (
                  <span
                    key={category.slug}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#f7ede8] px-3 py-1 text-sm font-medium text-[#633b3b]"
                  >
                    {category.name}
                    <span className="text-[#b87570]">×{num(category.clicks)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Searching for</h3>
            {searchIntent.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">No searches yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {searchIntent.map((search) => (
                  <span
                    key={search.keyword}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                  >
                    {search.keyword}
                    <span className="text-gray-400">×{num(search.count)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Top viewed dresses</h3>
            {topPicks.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">No dress views yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {topPicks.map((dress) => (
                  <li key={dress.productId} className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {dress.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dress.imageUrl} alt={dress.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <span className="flex-1 truncate text-sm font-medium text-gray-800">{dress.name}</span>
                    <span className="text-sm text-gray-400">{num(dress.views)} views</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Dresses viewed */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <EyeIcon className="h-5 w-5 text-[#b87570]" />
            <h2 className="text-lg font-semibold text-gray-900">Dresses viewed</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {num(dresses.length)}
          </span>
        </div>

        {dresses.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">This visitor has not viewed any dress yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Dress</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Views</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Detail opens</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Last viewed</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Store</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dresses.map((dress) => (
                  <tr key={dress.productId} className="transition-colors hover:bg-[#f7ede8]/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {dress.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={dress.imageUrl} alt={dress.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                              <SparklesIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <span className="max-w-[220px] truncate font-medium text-gray-900">{dress.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7ede8] px-2.5 py-1 text-sm font-semibold text-[#633b3b]">
                        <EyeIcon className="h-4 w-4 text-[#b87570]" />
                        {num(dress.views)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CursorArrowRaysIcon className="h-4 w-4 text-gray-400" />
                        {num(dress.clicks)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                      <div className="text-sm text-gray-700">{formatRelative(dress.lastViewedAt)}</div>
                      <div className="text-xs text-gray-400">{formatDateTime(dress.lastViewedAt)}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <a
                        href={dress.detailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#f7ede8] hover:text-[#b87570]"
                        aria-label={`Open ${dress.name} on storefront`}
                        title="Open on storefront"
                      >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Categories */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
            <TagIcon className="h-5 w-5 text-[#b87570]" />
            <h2 className="text-lg font-semibold text-gray-900">Categories browsed</h2>
          </div>
          {categories.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">No category activity yet.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {categories.map((category) => (
                <li key={category.slug} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-xs text-gray-400">Last opened {formatRelative(category.lastClickedAt)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7ede8] px-2.5 py-1 text-sm font-semibold text-[#633b3b]">
                    {num(category.clicks)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Searches */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-[#b87570]" />
            <h2 className="text-lg font-semibold text-gray-900">Searches</h2>
          </div>
          {searches.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">No searches yet.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {searches.map((search) => (
                <li key={search.keyword} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{search.keyword}</p>
                    <p className="text-xs text-gray-400">
                      {search.noResults > 0
                        ? `${num(search.noResults)} of ${num(search.count)} had no results`
                        : `Found results every time`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {search.noResults > 0 && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">No result</span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">
                      {num(search.count)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function VisitorProfileDetailPageWrapper() {
  return (
    <ProtectedRoute>
      <VisitorProfileDetailPage />
    </ProtectedRoute>
  );
}
