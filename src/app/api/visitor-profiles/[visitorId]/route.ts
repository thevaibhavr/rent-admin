import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import VisitorProfile from '@/lib/models/VisitorProfile';
import { requireAdmin } from '@/lib/auth';
import { fail, ok, serverError } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ visitorId: string }> };

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
