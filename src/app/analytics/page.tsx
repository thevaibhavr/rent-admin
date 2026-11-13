'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, CursorArrowRaysIcon, EyeIcon, MagnifyingGlassIcon, TagIcon, UsersIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiService } from '@/services/api';
import type { AnalyticsDashboardData } from '@/types';

type Period = 'today' | '7days' | '30days' | 'month' | 'custom';

const asDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7days');
  const [endDate, setEndDate] = useState(asDateInput(new Date()));
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return asDateInput(date);
  });
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiService.getActivityAnalytics({
        period,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...(period === 'custom' ? { startDate, endDate } : {}),
      });
      setData(result);
    } catch (loadError) {
      console.error('Unable to load activity analytics:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [endDate, period, startDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const summary = data?.summary;
  const cards = [
    { label: 'Total Dress Views', value: summary?.totalProductViews ?? 0, icon: EyeIcon },
    { label: 'Dress Clicks', value: summary?.totalProductClicks ?? 0, icon: CursorArrowRaysIcon },
    { label: 'Unique Visitors', value: summary?.uniqueVisitors ?? 0, icon: UsersIcon },
    { label: 'Repeat Visitors', value: summary?.repeatVisitors ?? 0, icon: UsersIcon },
    { label: 'Category Clicks', value: summary?.totalCategoryClicks ?? 0, icon: TagIcon },
    { label: 'Searches', value: summary?.totalSearches ?? 0, icon: MagnifyingGlassIcon },
    { label: 'Visitor Details Collected', value: summary?.visitorProfilesCount ?? 0, icon: UsersIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Activity &amp; Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">See which dresses, categories and searches are getting attention.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-gray-700">
            Date range
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
              className="mt-1 block rounded-md border-gray-300 py-2 pl-3 pr-8 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </label>
          {period === 'custom' && (
            <>
              <label className="text-sm font-medium text-gray-700">
                From
                <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block rounded-md border-gray-300 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </label>
              <label className="text-sm font-medium text-gray-700">
                To
                <input type="date" value={endDate} min={startDate} max={asDateInput(new Date())} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block rounded-md border-gray-300 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </label>
            </>
          )}
          <button type="button" onClick={loadAnalytics} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <Icon className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-gray-900">{loading ? '—' : value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {loading && !data ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Loading activity data...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <DressTable title="Most Viewed Dresses" rows={data?.products ?? []} />
          <DressTable title="Most Clicked Dresses" rows={data?.mostClickedProducts ?? []} />

          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Popular Categories</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr><th className="px-5 py-3">Category</th><th className="px-5 py-3">Clicks</th><th className="px-5 py-3">Unique Visitors</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.categories.map((category) => (
                    <tr key={category.categorySlug}>
                      <td className="px-5 py-3 font-medium text-gray-900">{category.name || category.categorySlug}</td>
                      <td className="px-5 py-3 text-gray-600">{category.totalClicks}</td>
                      <td className="px-5 py-3 text-gray-600">{category.uniqueVisitors}</td>
                    </tr>
                  ))}
                  {!data?.categories.length && <EmptyRow colSpan={3} />}
                </tbody>
              </table>
            </div>
          </section>

          <KeywordTable title="Most Searched Keywords" rows={data?.searchKeywords ?? []} countLabel="Searches" countKey="searches" />
          <KeywordTable title="Searches With No Results" rows={data?.noResultSearches ?? []} countLabel="No results" countKey="noResultSearches" />
          <VisitorProfileTable rows={data?.visitorProfiles ?? []} />
        </div>
      )}
    </div>
  );
}

function VisitorProfileTable({ rows }: { rows: AnalyticsDashboardData['visitorProfiles'] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm xl:col-span-2">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">Recently Collected Visitor Details</h2>
        <Link href="/visitor-profiles" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          View all
        </Link>
      </div>
      <p className="px-5 py-2 text-xs text-gray-500">Profiles collected within the selected date range.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Mobile</th>
              <th className="px-5 py-3">Village / City</th>
              <th className="px-5 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((profile) => (
              <tr key={profile.visitorId}>
                <td className="px-5 py-3 font-medium text-gray-900">{profile.name}</td>
                <td className="px-5 py-3 text-gray-600">
                  <a href={`tel:${profile.mobile}`} className="hover:text-indigo-600">{profile.mobile}</a>
                </td>
                <td className="px-5 py-3 text-gray-600">{profile.city}</td>
                <td className="px-5 py-3 text-gray-600">{new Date(profile.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {!rows.length && <EmptyRow colSpan={4} />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DressTable({ title, rows }: { title: string; rows: AnalyticsDashboardData['products'] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3">Dress</th>
              <th className="px-5 py-3">Views</th>
              <th className="px-5 py-3">Clicks</th>
              <th className="px-5 py-3">Viewers</th>
              <th className="px-5 py-3">Repeat</th>
              <th className="px-5 py-3">Click Visitors</th>
              <th className="px-5 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((product) => (
              <tr key={product.productId}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={48}
                        height={64}
                        unoptimized
                        className="h-16 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">No image</div>
                    )}
                    <span className="max-w-[180px] font-medium text-gray-900">{product.name || 'Unnamed dress'}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600">{product.totalViews}</td>
                <td className="px-5 py-3 text-gray-600">{product.totalClicks}</td>
                <td className="px-5 py-3 text-gray-600">{product.uniqueVisitors}</td>
                <td className="px-5 py-3 text-gray-600">{product.repeatVisitors}</td>
                <td className="px-5 py-3 text-gray-600">{product.uniqueClickVisitors}</td>
                <td className="px-5 py-3">
                  <a
                    href={product.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    View dress
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
            {!rows.length && <EmptyRow colSpan={7} />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan} className="px-5 py-8 text-center text-gray-500">No activity for this date range yet.</td></tr>;
}

function KeywordTable({
  title,
  rows,
  countLabel,
  countKey,
}: {
  title: string;
  rows: AnalyticsDashboardData['searchKeywords'];
  countLabel: string;
  countKey: 'searches' | 'noResultSearches';
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-5 py-3">Keyword</th><th className="px-5 py-3">{countLabel}</th><th className="px-5 py-3">Unique Visitors</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.keyword}>
                <td className="px-5 py-3 font-medium text-gray-900">{row.keyword}</td>
                <td className="px-5 py-3 text-gray-600">{row[countKey]}</td>
                <td className="px-5 py-3 text-gray-600">{row.uniqueVisitors}</td>
              </tr>
            ))}
            {!rows.length && <EmptyRow colSpan={3} />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AnalyticsPageWrapper() {
  return (
    <ProtectedRoute>
      <AnalyticsPage />
    </ProtectedRoute>
  );
}
