'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  CursorArrowRaysIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  TagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiService } from '@/services/api';
import type { AnalyticsDashboardData, AnalyticsViewer, ProductActivityStat } from '@/types';

type Period = 'today' | '7days' | '30days' | 'month' | 'custom';

const asDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDay = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

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
  const [dressQuery, setDressQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'viewed' | 'clicked'>('viewed');

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
  const dressRows = activeTab === 'viewed' ? data?.products ?? [] : data?.mostClickedProducts ?? [];
  const filteredDresses = useMemo(() => {
    const query = dressQuery.trim().toLowerCase();
    if (!query) return dressRows;
    return dressRows.filter((product) => (product.name || '').toLowerCase().includes(query));
  }, [dressQuery, dressRows]);

  const cards = [
    {
      label: 'Dress views',
      hint: 'Kitni baar dress page khuli',
      value: summary?.totalProductViews ?? 0,
      icon: EyeIcon,
      tone: 'rose',
    },
    {
      label: 'Unique people',
      hint: 'Alag-alag visitors',
      value: summary?.uniqueVisitors ?? 0,
      icon: UsersIcon,
      tone: 'indigo',
    },
    {
      label: 'Known contacts',
      hint: 'Naam/mobile diya hua',
      value: summary?.identifiedVisitors ?? 0,
      icon: PhoneIcon,
      tone: 'green',
    },
    {
      label: 'Unknown visitors',
      hint: 'Details nahi mili',
      value: summary?.unknownVisitors ?? 0,
      icon: UsersIcon,
      tone: 'slate',
    },
    {
      label: 'Repeat visitors',
      hint: 'Jo 1 se zyada baar aaye',
      value: summary?.repeatVisitors ?? 0,
      icon: ArrowPathIcon,
      tone: 'amber',
    },
    {
      label: 'Dress clicks',
      hint: 'Card/list se dress open',
      value: summary?.totalProductClicks ?? 0,
      icon: CursorArrowRaysIcon,
      tone: 'sky',
    },
    {
      label: 'Click rate',
      hint: 'Clicks / views',
      value: `${summary?.clickThroughRate ?? 0}%`,
      icon: ChartBarIcon,
      tone: 'violet',
    },
    {
      label: 'Avg views / person',
      hint: 'Ek visitor kitni baar dekhta hai',
      value: summary?.avgViewsPerVisitor ?? 0,
      icon: EyeIcon,
      tone: 'rose',
    },
    {
      label: 'Category clicks',
      hint: 'Kaunsi category chali',
      value: summary?.totalCategoryClicks ?? 0,
      icon: TagIcon,
      tone: 'orange',
    },
    {
      label: 'Searches',
      hint: 'Log kya dhoondh rahe hain',
      value: summary?.totalSearches ?? 0,
      icon: MagnifyingGlassIcon,
      tone: 'teal',
    },
  ];

  const topDressChart = (data?.products ?? []).slice(0, 8).map((product) => ({
    name: (product.name || 'Unnamed').slice(0, 18),
    views: product.totalViews,
    people: product.uniqueVisitors,
  }));

  const busyHours = (data?.hourlyViews ?? []).filter((row) => row.views > 0);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-[#3a2a28] px-5 py-6 text-white shadow-sm sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e0b78f]">Dress interest</p>
            <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">Kaun si dress dekh rahe hain?</h1>
            <p className="mt-2 text-sm leading-6 text-[#eadfd9]">
              Number pe hover/tap karein — pata chalega kaun-kaun dekha. Details nahi hain to naam <span className="font-semibold text-white">Unknown</span> dikhega.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-[#eadfd9]">
              Date range
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as Period)}
                className="mt-1 block rounded-xl border-0 bg-white/10 py-2.5 pl-3 pr-8 text-sm text-white outline-none ring-1 ring-white/15"
              >
                <option className="text-gray-900" value="today">Today</option>
                <option className="text-gray-900" value="7days">Last 7 days</option>
                <option className="text-gray-900" value="30days">Last 30 days</option>
                <option className="text-gray-900" value="month">This month</option>
                <option className="text-gray-900" value="custom">Custom</option>
              </select>
            </label>
            {period === 'custom' && (
              <>
                <label className="text-xs font-medium text-[#eadfd9]">
                  From
                  <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block rounded-xl border-0 bg-white/10 py-2 text-sm text-white outline-none ring-1 ring-white/15" />
                </label>
                <label className="text-xs font-medium text-[#eadfd9]">
                  To
                  <input type="date" value={endDate} min={startDate} max={asDateInput(new Date())} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block rounded-xl border-0 bg-white/10 py-2 text-sm text-white outline-none ring-1 ring-white/15" />
                </label>
              </>
            )}
            <button type="button" onClick={loadAnalytics} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#e0b78f] px-4 text-sm font-semibold text-[#3a2a28] hover:bg-[#edd0b3] disabled:opacity-50">
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, hint, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-[#eadfd9] bg-white p-4 shadow-[0_8px_24px_rgba(58,42,40,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#342b29]">{label}</p>
                <p className="mt-0.5 text-xs text-[#7a635c]">{hint}</p>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${toneClass(tone)}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-[#342b29]">{loading ? '—' : value.toLocaleString?.() ?? value}</p>
          </article>
        ))}
      </div>

      {loading && !data ? (
        <div className="rounded-2xl border border-[#eadfd9] bg-white p-10 text-center text-sm text-[#7a635c]">Analytics load ho raha hai...</div>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <ChartCard title="Rozana interest" subtitle="Views, clicks aur unique log">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.dailyTrend ?? []}>
                    <CartesianGrid stroke="#f0e6e0" strokeDasharray="4 4" />
                    <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fill: '#7a635c', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#7a635c', fontSize: 12 }} />
                    <Tooltip labelFormatter={formatDay} />
                    <Line type="monotone" dataKey="views" name="Views" stroke="#a85f67" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#218c58" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="uniqueVisitors" name="Unique people" stroke="#6b5ea8" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard title="Sabse zyada dekhi gayi" subtitle="Top 8 dresses">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDressChart} layout="vertical" margin={{ left: 8, right: 12 }}>
                    <CartesianGrid stroke="#f0e6e0" strokeDasharray="4 4" />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#7a635c', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#342b29', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="views" name="Views" fill="#a85f67" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <section className="rounded-2xl border border-[#eadfd9] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#342b29]">Dress-wise viewers</h2>
                <p className="mt-1 text-sm text-[#7a635c]">Unique people wale number pe hover/tap karein. Unknown = details nahi di.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full bg-[#f7efe9] p-1">
                  <button type="button" onClick={() => setActiveTab('viewed')} className={`rounded-full px-4 py-2 text-sm font-medium ${activeTab === 'viewed' ? 'bg-white text-[#754b4f] shadow-sm' : 'text-[#7a635c]'}`}>Most viewed</button>
                  <button type="button" onClick={() => setActiveTab('clicked')} className={`rounded-full px-4 py-2 text-sm font-medium ${activeTab === 'clicked' ? 'bg-white text-[#754b4f] shadow-sm' : 'text-[#7a635c]'}`}>Most clicked</button>
                </div>
                <input
                  value={dressQuery}
                  onChange={(event) => setDressQuery(event.target.value)}
                  placeholder="Dress search..."
                  className="min-h-10 rounded-full border border-[#eadfd9] px-4 text-sm outline-none focus:border-[#b88b87]"
                />
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              {filteredDresses.map((product, index) => (
                <DressRow key={`${activeTab}-${product.productId}`} product={product} rank={index + 1} />
              ))}
              {!filteredDresses.length && (
                <p className="rounded-xl bg-[#fcf9f6] px-4 py-8 text-center text-sm text-[#7a635c]">Is range mein koi dress activity nahi mili.</p>
              )}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Busy hours" subtitle="Kaun se time pe zyada log dresses dekhte hain">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.hourlyViews ?? []}>
                    <CartesianGrid stroke="#f0e6e0" strokeDasharray="4 4" />
                    <XAxis dataKey="hour" tickFormatter={formatHour} interval={2} tick={{ fill: '#7a635c', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#7a635c', fontSize: 12 }} />
                    <Tooltip labelFormatter={(hour) => formatHour(Number(hour))} />
                    <Bar dataKey="views" name="Views" fill="#c48a6a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {busyHours.length === 0 && <p className="mt-2 text-sm text-[#7a635c]">Abhi hour-wise data nahi hai.</p>}
            </ChartCard>

            <section className="rounded-2xl border border-[#eadfd9] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#342b29]">Most active people</h2>
              <p className="mt-1 text-sm text-[#7a635c]">Jo visitors sabse zyada dresses dekh rahe hain.</p>
              <div className="mt-4 space-y-3">
                {(data?.topVisitors ?? []).map((visitor) => (
                  <div key={visitor.visitorId} className="flex items-center justify-between gap-3 rounded-xl bg-[#fcf9f6] px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#342b29]">{visitor.name}</p>
                      <p className="truncate text-xs text-[#7a635c]">
                        {visitor.isUnknown ? 'Details nahi mili' : [visitor.mobile, visitor.city].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-[#754b4f]">{visitor.views} views</p>
                      <p className="text-xs text-[#7a635c]">{visitor.uniqueDresses} dresses</p>
                    </div>
                  </div>
                ))}
                {!data?.topVisitors.length && <p className="py-6 text-center text-sm text-[#7a635c]">Abhi koi visitor activity nahi hai.</p>}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SimpleTable
              title="Popular categories"
              headers={['Category', 'Clicks', 'People']}
              rows={(data?.categories ?? []).slice(0, 10).map((category) => [
                category.name || category.categorySlug,
                String(category.totalClicks),
                String(category.uniqueVisitors),
              ])}
            />
            <SimpleTable
              title="Most searched"
              headers={['Keyword', 'Searches', 'People']}
              rows={(data?.searchKeywords ?? []).map((row) => [row.keyword, String(row.searches), String(row.uniqueVisitors)])}
            />
            <SimpleTable
              title="Searches with no results"
              headers={['Keyword', 'No results', 'People']}
              rows={(data?.noResultSearches ?? []).map((row) => [row.keyword, String(row.noResultSearches), String(row.uniqueVisitors)])}
            />
            <section className="rounded-2xl border border-[#eadfd9] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#342b29]">New visitor details</h2>
                <Link href="/visitor-profiles" className="text-sm font-medium text-[#8e565b] hover:text-[#60373b]">View all</Link>
              </div>
              <div className="mt-4 space-y-3">
                {(data?.visitorProfiles ?? []).map((profile) => (
                  <div key={profile.visitorId} className="flex items-center justify-between gap-3 rounded-xl bg-[#fcf9f6] px-3 py-3">
                    <div>
                      <p className="font-medium text-[#342b29]">{profile.name}</p>
                      <p className="text-xs text-[#7a635c]">{profile.mobile} · {profile.city}</p>
                    </div>
                    <p className="text-xs text-[#7a635c]">{new Date(profile.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                ))}
                {!data?.visitorProfiles.length && <p className="py-6 text-center text-sm text-[#7a635c]">Is range mein koi naya contact nahi aaya.</p>}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function DressRow({ product, rank }: { product: ProductActivityStat; rank: number }) {
  const known = product.viewers.filter((viewer) => !viewer.isUnknown).length;
  const unknown = product.uniqueVisitors - known;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[#f0e6e0] bg-[#fffdfa] p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="w-6 text-sm font-semibold text-[#b88b87]">{rank}</span>
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} width={56} height={72} unoptimized className="h-[72px] w-14 rounded-xl object-cover" />
        ) : (
          <div className="flex h-[72px] w-14 items-center justify-center rounded-xl bg-[#eee4de] text-[10px] text-[#9a8580]">No img</div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#342b29]">{product.name || 'Unnamed dress'}</p>
          <p className="mt-1 text-sm text-[#7a635c]">{product.totalViews} views · {product.totalClicks} clicks · {product.repeatVisitors} repeat</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <StatChip label="Views" value={product.totalViews} />
        <ViewersHover count={product.uniqueVisitors} viewers={product.viewers} unknownCount={Math.max(unknown, 0)} />
        <a href={product.detailUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[#eadfd9] px-3 text-sm font-medium text-[#754b4f]">
          Open <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

function ViewersHover({
  count,
  viewers,
  unknownCount,
}: {
  count: number;
  viewers: AnalyticsViewer[];
  unknownCount: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-full bg-[#f4e7e2] px-3 py-2 text-left"
        aria-expanded={open}
      >
        <p className="text-[10px] uppercase tracking-wide text-[#9a7771]">Unique people</p>
        <p className="text-lg font-semibold text-[#754b4f] underline decoration-dotted underline-offset-4">{count}</p>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#eadfd9] bg-white shadow-[0_18px_40px_rgba(58,42,40,0.16)]">
          <div className="border-b border-[#f0e6e0] px-4 py-3">
            <p className="text-sm font-semibold text-[#342b29]">In logon ne ye dress dekhi</p>
            <p className="text-xs text-[#7a635c]">{count} unique · {unknownCount} Unknown</p>
          </div>
          <ul className="max-h-72 overflow-y-auto p-2">
            {viewers.map((viewer) => (
              <li key={viewer.visitorId} className="rounded-xl px-3 py-2 hover:bg-[#fcf9f6]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#342b29]">{viewer.name}</p>
                    <p className="truncate text-xs text-[#7a635c]">
                      {viewer.isUnknown ? 'Details nahi mili' : [viewer.mobile, viewer.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[#754b4f]">{viewer.views}x</span>
                </div>
              </li>
            ))}
            {!viewers.length && <li className="px-3 py-6 text-center text-sm text-[#7a635c]">Koi viewer nahi mila.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full bg-white px-3 py-2 ring-1 ring-[#eadfd9]">
      <p className="text-[10px] uppercase tracking-wide text-[#9a7771]">{label}</p>
      <p className="text-lg font-semibold text-[#342b29]">{value}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#eadfd9] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#342b29]">{title}</h2>
      <p className="mt-1 text-sm text-[#7a635c]">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SimpleTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#eadfd9] bg-white shadow-sm">
      <div className="px-5 py-4">
        <h2 className="text-lg font-semibold text-[#342b29]">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#fcf9f6] text-left text-xs uppercase tracking-wide text-[#9a7771]">
            <tr>
              {headers.map((header) => <th key={header} className="px-5 py-3 font-medium">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e6e0]">
            {rows.map((row) => (
              <tr key={row.join('-')}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className={`px-5 py-3 ${index === 0 ? 'font-medium text-[#342b29]' : 'text-[#7a635c]'}`}>{cell}</td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center text-[#7a635c]">No data yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function toneClass(tone: string) {
  const tones: Record<string, string> = {
    rose: 'bg-[#f8e9e8] text-[#a85f67]',
    indigo: 'bg-[#eee8fb] text-[#6b5ea8]',
    green: 'bg-[#e7f4ec] text-[#218c58]',
    slate: 'bg-[#eeeae8] text-[#6f635e]',
    amber: 'bg-[#f8eedd] text-[#b07a2e]',
    sky: 'bg-[#e7f2fb] text-[#3b7ca8]',
    violet: 'bg-[#f1e8fb] text-[#7a4ea3]',
    orange: 'bg-[#f8ebe3] text-[#c26a3a]',
    teal: 'bg-[#e6f4f1] text-[#2f8a7b]',
  };
  return tones[tone] ?? tones.rose;
}

export default function AnalyticsPageWrapper() {
  return (
    <ProtectedRoute>
      <AnalyticsPage />
    </ProtectedRoute>
  );
}
