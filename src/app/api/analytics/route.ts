import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import AnalyticsEvent from '@/lib/models/AnalyticsEvent';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import VisitorProfile from '@/lib/models/VisitorProfile';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

type Period = 'today' | '7days' | '30days' | 'month' | 'custom';

interface ProductViewerStub {
  visitorId: string;
  views: number;
  clicks: number;
}

interface ProductActivity {
  productId: string;
  name: string;
  totalViews: number;
  totalClicks: number;
  uniqueVisitors: number;
  repeatVisitors: number;
  uniqueClickVisitors: number;
  viewers: ProductViewerStub[];
}

interface ProductActivityFacet {
  mostViewed: ProductActivity[];
  mostClicked: ProductActivity[];
}

interface VisitorIdentity {
  visitorId: string;
  name: string;
  mobile: string;
  city: string;
}

const UNKNOWN_NAME = 'Unknown';

const shiftDate = (value: string, days: number) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};

const listDates = (startDate: string, lastDate: string) => {
  const dates: string[] = [];
  for (let current = startDate; current <= lastDate; current = shiftDate(current, 1)) {
    dates.push(current);
  }
  return dates;
};

const withIdentity = (
  visitorId: string,
  views: number,
  clicks: number,
  profiles: Map<string, VisitorIdentity>,
) => {
  const profile = profiles.get(visitorId);
  return {
    visitorId,
    name: profile?.name || UNKNOWN_NAME,
    mobile: profile?.mobile || '',
    city: profile?.city || '',
    views,
    clicks,
    isUnknown: !profile,
  };
};

const parseDate = (value: string | null): string | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
};

const startOfDay = (value: string, timeZone: string) => {
  const [year, month, day] = value.split('-').map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day);
  const localParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(utcMidnight));
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(localParts.find((item) => item.type === type)?.value);
  const localTimeAsUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
  return new Date(utcMidnight - (localTimeAsUtc - utcMidnight));
};

const getDateRange = (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const period = (params.get('period') || '7days') as Period;
  const timeZone = params.get('timeZone') || 'UTC';
  let todayFormatter: Intl.DateTimeFormat;
  try {
    todayFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }

  const todayParts = todayFormatter.formatToParts(new Date());
  const today = `${todayParts.find((item) => item.type === 'year')?.value}-${todayParts.find((item) => item.type === 'month')?.value}-${todayParts.find((item) => item.type === 'day')?.value}`;
  let startDate: string;
  let lastDate = today;

  switch (period) {
    case 'today':
      startDate = today;
      break;
    case '7days':
      startDate = shiftDate(today, -6);
      break;
    case '30days':
      startDate = shiftDate(today, -29);
      break;
    case 'month':
      startDate = `${today.slice(0, 7)}-01`;
      break;
    case 'custom': {
      startDate = parseDate(params.get('startDate')) ?? '';
      lastDate = parseDate(params.get('endDate')) ?? '';
      if (!startDate || !lastDate || startDate > lastDate || lastDate > today) return null;
      break;
    }
    default:
      return null;
  }

  return {
    start: startOfDay(startDate, timeZone),
    end: startOfDay(shiftDate(lastDate, 1), timeZone),
    timeZone,
    startDate,
    lastDate,
  };
};

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  const dateRange = getDateRange(request);
  if (!dateRange) return fail('Invalid analytics date range', 400);

  try {
    await connectDB();
    const dateFilter = { createdAt: { $gte: dateRange.start, $lt: dateRange.end } };
    const productViews = { ...dateFilter, type: 'product_view' as const };
    const productClicks = { ...dateFilter, type: 'product_click' as const };
    const categoryClickFilter = { ...dateFilter, type: 'category_click' as const };
    const searches = { ...dateFilter, type: 'search' as const };

    const [
      totalProductViews,
      totalProductClicks,
      visitorIdentityStats,
      repeatVisitors,
      productActivityResult,
      categoryClickStats,
      activeCategories,
      searchKeywords,
      visitorProfilesCount,
      visitorProfiles,
      dailyTrendRaw,
      hourlyViewsRaw,
      topVisitorsRaw,
    ] = await Promise.all([
      AnalyticsEvent.countDocuments(productViews),
      AnalyticsEvent.countDocuments(productClicks),
      AnalyticsEvent.aggregate([
        { $match: productViews },
        { $group: { _id: '$visitorId' } },
        {
          $lookup: {
            from: 'visitor_profiles',
            localField: '_id',
            foreignField: 'visitorId',
            as: 'profile',
          },
        },
        {
          $group: {
            _id: null,
            uniqueVisitors: { $sum: 1 },
            identifiedVisitors: { $sum: { $cond: [{ $gt: [{ $size: '$profile' }, 0] }, 1, 0] } },
          },
        },
      ]),
      AnalyticsEvent.aggregate([
        { $match: productViews },
        { $group: { _id: '$visitorId', views: { $sum: 1 } } },
        { $match: { views: { $gt: 1 } } },
        { $count: 'count' },
      ]),
      AnalyticsEvent.aggregate<ProductActivityFacet>([
        { $match: { ...dateFilter, type: { $in: ['product_view', 'product_click'] } } },
        {
          $group: {
            _id: { productId: '$productId', visitorId: '$visitorId' },
            name: { $first: '$productName' },
            views: { $sum: { $cond: [{ $eq: ['$type', 'product_view'] }, 1, 0] } },
            clicks: { $sum: { $cond: [{ $eq: ['$type', 'product_click'] }, 1, 0] } },
          },
        },
        {
          $group: {
            _id: '$_id.productId',
            name: { $first: '$name' },
            totalViews: { $sum: '$views' },
            totalClicks: { $sum: '$clicks' },
            uniqueVisitors: { $sum: { $cond: [{ $gt: ['$views', 0] }, 1, 0] } },
            repeatVisitors: { $sum: { $cond: [{ $gt: ['$views', 1] }, 1, 0] } },
            uniqueClickVisitors: { $sum: { $cond: [{ $gt: ['$clicks', 0] }, 1, 0] } },
            viewers: {
              $push: {
                $cond: [
                  { $gt: ['$views', 0] },
                  { visitorId: '$_id.visitorId', views: '$views', clicks: '$clicks' },
                  '$$REMOVE',
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            name: 1,
            totalViews: 1,
            totalClicks: 1,
            uniqueVisitors: 1,
            repeatVisitors: 1,
            uniqueClickVisitors: 1,
            viewers: 1,
          },
        },
        {
          $facet: {
            mostViewed: [
              { $match: { totalViews: { $gt: 0 } } },
              { $sort: { totalViews: -1, uniqueVisitors: -1 } },
              { $limit: 20 },
            ],
            mostClicked: [
              { $match: { totalClicks: { $gt: 0 } } },
              { $sort: { totalClicks: -1, uniqueClickVisitors: -1 } },
              { $limit: 20 },
            ],
          },
        },
      ]),
      AnalyticsEvent.aggregate([
        { $match: categoryClickFilter },
        {
          $group: {
            _id: { categorySlug: '$categorySlug', visitorId: '$visitorId' },
            clicks: { $sum: 1 },
            name: { $first: '$categoryName' },
          },
        },
        {
          $group: {
            _id: '$_id.categorySlug',
            name: { $first: '$name' },
            totalClicks: { $sum: '$clicks' },
            uniqueVisitors: { $sum: 1 },
          },
        },
        { $sort: { totalClicks: -1, uniqueVisitors: -1 } },
        { $project: { _id: 0, categorySlug: '$_id', name: 1, totalClicks: 1, uniqueVisitors: 1 } },
      ]),
      Category.find({ isActive: true }).select('name slug').lean(),
      AnalyticsEvent.aggregate([
        { $match: searches },
        {
          $group: {
            _id: { keyword: '$keyword', visitorId: '$visitorId' },
            searches: { $sum: 1 },
            noResultSearches: { $sum: { $cond: [{ $eq: ['$resultCount', 0] }, 1, 0] } },
          },
        },
        {
          $group: {
            _id: '$_id.keyword',
            searches: { $sum: '$searches' },
            uniqueVisitors: { $sum: 1 },
            noResultSearches: { $sum: '$noResultSearches' },
          },
        },
        { $sort: { searches: -1, uniqueVisitors: -1 } },
        { $project: { _id: 0, keyword: '$_id', searches: 1, uniqueVisitors: 1, noResultSearches: 1 } },
      ]),
      VisitorProfile.countDocuments(dateFilter),
      VisitorProfile.find(dateFilter)
        .select('visitorId name mobile city createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      AnalyticsEvent.aggregate([
        { $match: { ...dateFilter, type: { $in: ['product_view', 'product_click'] } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: dateRange.timeZone } },
              type: '$type',
            },
            count: { $sum: 1 },
            visitors: { $addToSet: '$visitorId' },
          },
        },
      ]),
      AnalyticsEvent.aggregate([
        { $match: productViews },
        {
          $group: {
            _id: { $hour: { date: '$createdAt', timezone: dateRange.timeZone } },
            views: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: productViews },
        {
          $group: {
            _id: '$visitorId',
            views: { $sum: 1 },
            dresses: { $addToSet: '$productId' },
            lastSeen: { $max: '$createdAt' },
          },
        },
        { $addFields: { uniqueDresses: { $size: '$dresses' } } },
        { $sort: { views: -1, uniqueDresses: -1 } },
        { $limit: 12 },
        { $project: { dresses: 0 } },
      ]),
    ]);

    const mostViewedProducts = productActivityResult[0]?.mostViewed ?? [];
    const mostClickedProducts = productActivityResult[0]?.mostClicked ?? [];
    const uniqueVisitorCount = visitorIdentityStats[0]?.uniqueVisitors ?? 0;
    const identifiedVisitors = visitorIdentityStats[0]?.identifiedVisitors ?? 0;
    const unknownVisitors = Math.max(uniqueVisitorCount - identifiedVisitors, 0);
    const viewerIds = Array.from(new Set([
      ...mostViewedProducts.flatMap((product) => product.viewers.map((viewer) => viewer.visitorId)),
      ...mostClickedProducts.flatMap((product) => product.viewers.map((viewer) => viewer.visitorId)),
      ...topVisitorsRaw.map((visitor) => String(visitor._id)),
    ].filter(Boolean)));
    const viewerProfiles = viewerIds.length
      ? await VisitorProfile.find({ visitorId: { $in: viewerIds } }).select('visitorId name mobile city').lean()
      : [];
    const profileByVisitorId = new Map(
      viewerProfiles.map((profile) => [profile.visitorId, {
        visitorId: profile.visitorId,
        name: profile.name,
        mobile: profile.mobile,
        city: profile.city,
      }]),
    );
    const productIds = Array.from(new Set([
      ...mostViewedProducts.map((product) => product.productId),
      ...mostClickedProducts.map((product) => product.productId),
    ]));
    const currentProducts = await Product.find({ _id: { $in: productIds } }).select('images').lean();
    const imagesByProductId = new Map(currentProducts.map((product) => [String(product._id), product.images]));
    const storefrontBaseUrl = (
      process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://rent-moment-frontend.vercel.app'
    ).replace(/\/+$/, '');
    const withProductDetails = (product: (typeof mostViewedProducts)[number]) => ({
      ...product,
      viewers: [...(product.viewers ?? [])]
        .sort((left, right) => right.views - left.views)
        .slice(0, 40)
        .map((viewer) => withIdentity(viewer.visitorId, viewer.views, viewer.clicks, profileByVisitorId)),
      imageUrl: imagesByProductId.get(product.productId)?.find(Boolean) ?? null,
      detailUrl: `${storefrontBaseUrl}/product/${encodeURIComponent(product.productId)}`,
    });
    const dailyByDate = new Map<string, { views: number; clicks: number; uniqueVisitors: number }>();
    for (const row of dailyTrendRaw as Array<{ _id: { date: string; type: string }; count: number; visitors: string[] }>) {
      const current = dailyByDate.get(row._id.date) ?? { views: 0, clicks: 0, uniqueVisitors: 0 };
      if (row._id.type === 'product_view') {
        current.views += row.count;
        current.uniqueVisitors = row.visitors.length;
      }
      if (row._id.type === 'product_click') current.clicks += row.count;
      dailyByDate.set(row._id.date, current);
    }
    const hourlyMap = new Map((hourlyViewsRaw as Array<{ _id: number; views: number }>).map((row) => [row._id, row.views]));

    return ok({
      summary: {
        totalProductViews,
        totalProductClicks,
        uniqueVisitors: uniqueVisitorCount,
        repeatVisitors: repeatVisitors[0]?.count ?? 0,
        identifiedVisitors,
        unknownVisitors,
        totalCategoryClicks: categoryClickStats.reduce((total, category) => total + category.totalClicks, 0),
        totalSearches: searchKeywords.reduce((total, keyword) => total + keyword.searches, 0),
        visitorProfilesCount,
        clickThroughRate: totalProductViews > 0 ? Math.round((totalProductClicks / totalProductViews) * 1000) / 10 : 0,
        avgViewsPerVisitor: uniqueVisitorCount > 0 ? Math.round((totalProductViews / uniqueVisitorCount) * 10) / 10 : 0,
      },
      visitorProfiles,
      products: mostViewedProducts.map(withProductDetails),
      mostClickedProducts: mostClickedProducts.map(withProductDetails),
      dailyTrend: listDates(dateRange.startDate, dateRange.lastDate).map((date) => ({
        date,
        views: dailyByDate.get(date)?.views ?? 0,
        clicks: dailyByDate.get(date)?.clicks ?? 0,
        uniqueVisitors: dailyByDate.get(date)?.uniqueVisitors ?? 0,
      })),
      hourlyViews: Array.from({ length: 24 }, (_, hour) => ({ hour, views: hourlyMap.get(hour) ?? 0 })),
      topVisitors: topVisitorsRaw.map((visitor) => {
        const identity = withIdentity(String(visitor._id), visitor.views, 0, profileByVisitorId);
        return {
          visitorId: identity.visitorId,
          name: identity.name,
          mobile: identity.mobile,
          city: identity.city,
          isUnknown: identity.isUnknown,
          views: visitor.views,
          uniqueDresses: visitor.uniqueDresses,
          lastSeen: visitor.lastSeen,
        };
      }),
      categories: activeCategories
        .flatMap((category) => {
          if (!category.slug) return [];
          const stats = categoryClickStats.find((item) => item.categorySlug === category.slug);
          return [{
            categorySlug: category.slug,
            name: category.name,
            totalClicks: stats?.totalClicks ?? 0,
            uniqueVisitors: stats?.uniqueVisitors ?? 0,
          }];
        })
        .sort((left, right) => right.totalClicks - left.totalClicks),
      searchKeywords: searchKeywords.slice(0, 10),
      noResultSearches: searchKeywords
        .filter((keyword) => keyword.noResultSearches > 0)
        .sort((left, right) => right.noResultSearches - left.noResultSearches)
        .slice(0, 10),
    });
  } catch (error) {
    return serverError(error, 'Server error while fetching user activity analytics');
  }
}
