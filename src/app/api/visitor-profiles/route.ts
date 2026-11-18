import { NextRequest } from 'next/server';
import type { PipelineStage } from 'mongoose';
import { connectDB } from '@/lib/db';
import VisitorProfile from '@/lib/models/VisitorProfile';
import AnalyticsEvent from '@/lib/models/AnalyticsEvent';
import { requireAdmin } from '@/lib/auth';
import { fail, ok, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfTodayIST = () => {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  const startUtc = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate());
  return new Date(startUtc - IST_OFFSET_MS);
};

const ACTIVITY_FILTERS = new Set([
  'all',
  'last_7_days',
  'today',
  'yesterday',
  'last_15_days',
  'not_visited_30',
]);

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  const params = request.nextUrl.searchParams;
  const requestedPage = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(params.get('limit') || '20', 10) || 20));
  const search = (params.get('search') || '').trim().slice(0, 100);
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchFilter = search
    ? {
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { mobile: { $regex: escapedSearch, $options: 'i' } },
          { city: { $regex: escapedSearch, $options: 'i' } },
        ],
      }
    : {};

  const requestedFilter = (params.get('filter') || 'all').trim();
  const activityFilter = ACTIVITY_FILTERS.has(requestedFilter) ? requestedFilter : 'all';

  let activityMatch: Record<string, unknown> | null = null;
  const now = Date.now();
  if (activityFilter === 'today') {
    activityMatch = { lastSeen: { $gte: startOfTodayIST() } };
  } else if (activityFilter === 'yesterday') {
    const todayStart = startOfTodayIST();
    activityMatch = { lastSeen: { $gte: new Date(todayStart.getTime() - DAY_MS), $lt: todayStart } };
  } else if (activityFilter === 'last_7_days') {
    activityMatch = { lastSeen: { $gte: new Date(now - 7 * DAY_MS) } };
  } else if (activityFilter === 'last_15_days') {
    activityMatch = { lastSeen: { $gte: new Date(now - 15 * DAY_MS) } };
  } else if (activityFilter === 'not_visited_30') {
    activityMatch = {
      $expr: { $lt: [{ $ifNull: ['$lastSeen', '$createdAt'] }, new Date(now - 30 * DAY_MS)] },
    };
  }

  try {
    await connectDB();

    // Attach the visitor's most recent activity so we can show "Last Visit"
    // and filter the list by how recently they were active.
    const basePipeline: PipelineStage[] = [
      { $match: searchFilter },
      {
        $lookup: {
          from: AnalyticsEvent.collection.name,
          let: { vid: '$visitorId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$visitorId', '$$vid'] } } },
            { $group: { _id: null, lastSeen: { $max: '$createdAt' } } },
          ],
          as: 'activity',
        },
      },
      {
        $addFields: {
          lastSeen: { $ifNull: [{ $arrayElemAt: ['$activity.lastSeen', 0] }, null] },
        },
      },
    ];

    if (activityMatch) basePipeline.push({ $match: activityMatch } as PipelineStage);

    const countResult = await VisitorProfile.aggregate([
      ...basePipeline,
      { $count: 'total' },
    ]);
    const total: number = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.min(requestedPage, Math.max(totalPages, 1));

    const profiles = await VisitorProfile.aggregate([
      ...basePipeline,
      { $sort: { lastSeen: -1, createdAt: -1 } },
      { $skip: (currentPage - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          visitorId: 1,
          name: 1,
          mobile: 1,
          city: 1,
          createdAt: 1,
          lastSeen: 1,
        },
      },
    ]);

    return ok({
      profiles,
      total,
      totalPages,
      currentPage,
    });
  } catch (error) {
    return serverError(error, 'Server error while fetching visitor profiles');
  }
}
