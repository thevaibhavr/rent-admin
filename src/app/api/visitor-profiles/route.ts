import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import VisitorProfile from '@/lib/models/VisitorProfile';
import { requireAdmin } from '@/lib/auth';
import { fail, ok, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return fail(auth.error.message, auth.error.status);

  const params = request.nextUrl.searchParams;
  const requestedPage = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(params.get('limit') || '20', 10) || 20));
  const search = (params.get('search') || '').trim().slice(0, 100);
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = search
    ? {
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { mobile: { $regex: escapedSearch, $options: 'i' } },
          { city: { $regex: escapedSearch, $options: 'i' } },
        ],
      }
    : {};

  try {
    await connectDB();
    const total = await VisitorProfile.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.min(requestedPage, Math.max(totalPages, 1));
    const profiles = await VisitorProfile.find(filter)
      .select('visitorId name mobile city createdAt')
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .lean();

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
