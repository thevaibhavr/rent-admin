import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import VisitorProfile from '@/lib/models/VisitorProfile';
import AnalyticsEvent from '@/lib/models/AnalyticsEvent';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/auth';
import { fail, ok, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ visitorId: string }> };

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const STOREFRONT_BASE_URL = (
  process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://rent-moment-frontend.vercel.app'
).replace(/\/+$/, '');
const VISITOR_TIME_ZONE = 'Asia/Kolkata';

const toDayKey = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: VISITOR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const cleanText = (value: unknown) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

const hasControlCharacters = (value: string) =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });

const normalizeIndianMobile = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '').slice(-10);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
};

const isValidVisitorId = (value: string) => /^[a-zA-Z0-9-]{16,100}$/.test(value);

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const TIMELINE_LIMIT = 150;

const RANGE_KEYS = new Set(['all', 'today', 'yesterday', '7d', '15d', '30d', 'custom']);

const startOfTodayIST = () => {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  const startUtc = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate());
  return new Date(startUtc - IST_OFFSET_MS);
};

const parseDateIST = (value: string, endOfDay: boolean) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const startUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const start = new Date(startUtc - IST_OFFSET_MS);
  return endOfDay ? new Date(start.getTime() + DAY_MS - 1) : start;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  const { visitorId } = await params;
  if (!isValidVisitorId(visitorId)) return fail('Invalid visitor profile', 400);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return fail('Please submit valid visitor details.', 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return fail('Please submit valid visitor details.', 400);
  }

  const name = cleanText(body.name);
  const city = cleanText(body.city);
  const mobile = normalizeIndianMobile(body.mobile);

  if (name.length < 2 || name.length > 80 || hasControlCharacters(name)) {
    return fail('Please enter a name between 2 and 80 characters.', 400);
  }
  if (!mobile) return fail('Please enter a valid 10-digit Indian mobile number.', 400);
  if (city.length < 2 || city.length > 100 || hasControlCharacters(city)) {
    return fail('Please enter a village or city between 2 and 100 characters.', 400);
  }

  try {
    await connectDB();
    const profile = await VisitorProfile.findOneAndUpdate(
      { visitorId },
      { $set: { name, mobile, city } },
      { new: true, runValidators: true },
    ).select('visitorId name mobile city createdAt');

    if (!profile) return fail('Visitor profile not found', 404);
    return ok({ profile }, 200, 'Visitor details updated successfully.');
  } catch (error) {
    return serverError(error, 'Server error while updating visitor profile');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  const { visitorId } = await params;
  if (!isValidVisitorId(visitorId)) return fail('Invalid visitor profile', 400);

  try {
    await connectDB();
    const deletedProfile = await VisitorProfile.findOneAndDelete({ visitorId });
    if (!deletedProfile) return fail('Visitor profile not found', 404);

    return ok(undefined, 200, 'Visitor profile deleted successfully.');
  } catch (error) {
    return serverError(error, 'Server error while deleting visitor profile');
  }
}

interface DressStat {
  productId: string;
  name: string;
  views: number;
  clicks: number;
  lastViewedAt: Date | null;
  lastClickedAt: Date | null;
}

interface CategoryStat {
  slug: string;
  name: string;
  clicks: number;
  lastClickedAt: Date | null;
}

interface SearchStat {
  keyword: string;
  count: number;
  noResults: number;
  lastSearchedAt: Date | null;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  const { visitorId } = await params;
  if (!isValidVisitorId(visitorId)) return fail('Invalid visitor profile', 400);

  const searchParams = request.nextUrl.searchParams;
  const requestedRange = (searchParams.get('range') || 'all').trim();
  const rangeKey = RANGE_KEYS.has(requestedRange) ? requestedRange : 'all';

  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  if (rangeKey === 'today') {
    rangeStart = startOfTodayIST();
  } else if (rangeKey === 'yesterday') {
    const todayStart = startOfTodayIST();
    rangeStart = new Date(todayStart.getTime() - DAY_MS);
    rangeEnd = todayStart;
  } else if (rangeKey === '7d') {
    rangeStart = new Date(Date.now() - 7 * DAY_MS);
  } else if (rangeKey === '15d') {
    rangeStart = new Date(Date.now() - 15 * DAY_MS);
  } else if (rangeKey === '30d') {
    rangeStart = new Date(Date.now() - 30 * DAY_MS);
  } else if (rangeKey === 'custom') {
    rangeStart = parseDateIST((searchParams.get('startDate') || '').trim(), false);
    rangeEnd = parseDateIST((searchParams.get('endDate') || '').trim(), true);
  }

  const inRange = (date: Date) => {
    if (rangeStart && date < rangeStart) return false;
    if (rangeEnd && date > rangeEnd) return false;
    return true;
  };

  try {
    await connectDB();
    const profile = await VisitorProfile.findOne({ visitorId })
      .select('visitorId name mobile city createdAt')
      .lean();
    if (!profile) return fail('Visitor profile not found', 404);

    const events = await AnalyticsEvent.find({ visitorId })
      .select('type productId productName categorySlug categoryName keyword resultCount createdAt')
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const dresses = new Map<string, DressStat>();
    const categories = new Map<string, CategoryStat>();
    const searches = new Map<string, SearchStat>();
    const activeDayKeys = new Set<string>();

    let totalViews = 0;
    let totalProductClicks = 0;
    let totalSearches = 0;
    let totalCategoryClicks = 0;
    let totalEventsInRange = 0;
    let firstSeen: Date | null = null;
    let lastSeen: Date | null = null;

    for (const event of events) {
      const at = event.createdAt instanceof Date ? event.createdAt : new Date(event.createdAt);
      const validAt = !Number.isNaN(at.getTime());

      if (validAt) {
        if (!firstSeen || at < firstSeen) firstSeen = at;
        if (!lastSeen || at > lastSeen) lastSeen = at;
        activeDayKeys.add(toDayKey(at));
      }

      if (validAt && !inRange(at)) continue;
      totalEventsInRange += 1;

      if (event.type === 'product_view' || event.type === 'product_click') {
        const productId = event.productId ? String(event.productId) : '';
        if (!productId) continue;

        const current = dresses.get(productId) ?? {
          productId,
          name: event.productName || 'Untitled',
          views: 0,
          clicks: 0,
          lastViewedAt: null,
          lastClickedAt: null,
        };
        if (event.productName) current.name = event.productName;

        if (event.type === 'product_view') {
          current.views += 1;
          totalViews += 1;
          if (validAt && (!current.lastViewedAt || at > current.lastViewedAt)) current.lastViewedAt = at;
        } else {
          current.clicks += 1;
          totalProductClicks += 1;
          if (validAt && (!current.lastClickedAt || at > current.lastClickedAt)) current.lastClickedAt = at;
        }
        dresses.set(productId, current);
      } else if (event.type === 'category_click') {
        const slug = event.categorySlug ? String(event.categorySlug) : '';
        if (!slug) continue;

        const current = categories.get(slug) ?? {
          slug,
          name: event.categoryName || slug,
          clicks: 0,
          lastClickedAt: null,
        };
        if (event.categoryName) current.name = event.categoryName;
        current.clicks += 1;
        totalCategoryClicks += 1;
        if (validAt && (!current.lastClickedAt || at > current.lastClickedAt)) current.lastClickedAt = at;
        categories.set(slug, current);
      } else if (event.type === 'search') {
        const keyword = event.keyword ? String(event.keyword) : '';
        if (!keyword) continue;

        const current = searches.get(keyword) ?? {
          keyword,
          count: 0,
          noResults: 0,
          lastSearchedAt: null,
        };
        current.count += 1;
        totalSearches += 1;
        if (event.resultCount === 0) current.noResults += 1;
        if (validAt && (!current.lastSearchedAt || at > current.lastSearchedAt)) current.lastSearchedAt = at;
        searches.set(keyword, current);
      }
    }

    const timeline = events
      .map((event) => ({
        event,
        at: event.createdAt instanceof Date ? event.createdAt : new Date(event.createdAt),
      }))
      .filter(({ at }) => !Number.isNaN(at.getTime()) && inRange(at))
      .slice(0, TIMELINE_LIMIT)
      .map(({ event, at }) => {
        const createdAt = at.toISOString();
        if (event.type === 'product_view' || event.type === 'product_click') {
          const productId = event.productId ? String(event.productId) : null;
          const name = event.productName || 'a dress';
          return {
            type: event.type,
            label: event.type === 'product_view' ? `Viewed "${name}"` : `Opened "${name}"`,
            detail: null as string | null,
            productId,
            detailUrl: productId ? `${STOREFRONT_BASE_URL}/product/${encodeURIComponent(productId)}` : null,
            createdAt,
          };
        }
        if (event.type === 'category_click') {
          return {
            type: event.type,
            label: `Browsed "${event.categoryName || event.categorySlug || 'a category'}"`,
            detail: null as string | null,
            productId: null,
            detailUrl: null,
            createdAt,
          };
        }
        return {
          type: event.type,
          label: `Searched "${event.keyword || ''}"`,
          detail: event.resultCount === 0 ? 'No results found' : null,
          productId: null,
          detailUrl: null,
          createdAt,
        };
      });

    const dressProductIds = [...dresses.keys()].filter((id) => OBJECT_ID_REGEX.test(id));
    const productDocs = dressProductIds.length
      ? await Product.find({ _id: { $in: dressProductIds } }).select('name images').lean()
      : [];
    const productById = new Map(productDocs.map((product) => [String(product._id), product]));

    const dressList = [...dresses.values()]
      .sort((left, right) => right.views - left.views || right.clicks - left.clicks || left.name.localeCompare(right.name))
      .slice(0, 100)
      .map((dress) => {
        const product = productById.get(dress.productId);
        return {
          productId: dress.productId,
          name: product?.name || dress.name,
          views: dress.views,
          clicks: dress.clicks,
          lastViewedAt: dress.lastViewedAt ? dress.lastViewedAt.toISOString() : null,
          lastClickedAt: dress.lastClickedAt ? dress.lastClickedAt.toISOString() : null,
          imageUrl: product?.images?.find(Boolean) ?? null,
          detailUrl: `${STOREFRONT_BASE_URL}/product/${encodeURIComponent(dress.productId)}`,
        };
      });

    const categoryList = [...categories.values()]
      .sort((left, right) => right.clicks - left.clicks || left.name.localeCompare(right.name))
      .slice(0, 50)
      .map((category) => ({
        slug: category.slug,
        name: category.name,
        clicks: category.clicks,
        lastClickedAt: category.lastClickedAt ? category.lastClickedAt.toISOString() : null,
      }));

    const searchList = [...searches.values()]
      .sort((left, right) => right.count - left.count || left.keyword.localeCompare(right.keyword))
      .slice(0, 100)
      .map((search) => ({
        keyword: search.keyword,
        count: search.count,
        noResults: search.noResults,
        lastSearchedAt: search.lastSearchedAt ? search.lastSearchedAt.toISOString() : null,
      }));

    const uniqueDresses = [...dresses.values()].filter((dress) => dress.views > 0).length;

    return ok({
      profile: {
        visitorId: profile.visitorId,
        name: profile.name,
        mobile: profile.mobile,
        city: profile.city,
        createdAt: profile.createdAt,
      },
      summary: {
        totalViews,
        totalProductClicks,
        uniqueDresses,
        totalSearches,
        totalCategoryClicks,
        totalEvents: totalEventsInRange,
        activeDays: activeDayKeys.size,
        firstSeen: firstSeen ? firstSeen.toISOString() : null,
        lastSeen: lastSeen ? lastSeen.toISOString() : null,
      },
      range: rangeKey,
      dresses: dressList,
      categories: categoryList,
      searches: searchList,
      timeline,
    });
  } catch (error) {
    return serverError(error, 'Server error while fetching visitor activity');
  }
}
