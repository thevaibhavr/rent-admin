import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { fail, ok, serverError } from '@/lib/apiResponse';
import { uploadImage } from '@/lib/cloudinary';
import Occasion from '@/lib/models/Occasion';
import { validateOccasionBody } from './validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.max(1, Number(searchParams.get('limit') ?? 10));
    const sort = searchParams.get('sort') ?? 'displayOrder';
    const order = searchParams.get('order') ?? 'asc';
    const filter: Record<string, unknown> = {};
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (status) {
      filter.status = status.toLowerCase() === 'inactive' ? 'inactive' : 'active';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const occasions = await Occasion.find(filter)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const total = await Occasion.countDocuments(filter);

    return ok({
      occasions,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      total,
    });
  } catch (error) {
    return serverError(error, 'Server error while fetching occasions');
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const errors = validateOccasionBody(body, false);
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const { name, description, image, status, displayOrder } = body as {
      name: string;
      description?: string;
      image?: string;
      status?: 'active' | 'inactive';
      displayOrder?: number;
    };
    const existingOccasion = await Occasion.findOne({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });
    if (existingOccasion) {
      return fail('An occasion with this name already exists', 400);
    }

    let imageUrl = image || '';
    if (imageUrl.startsWith('data:image')) {
      const uploadResult = await uploadImage(imageUrl, 'occasions');
      imageUrl = uploadResult.url;
    }

    const occasion = new Occasion({
      name,
      description,
      image: imageUrl,
      status: status ?? 'active',
      isActive: (status ?? 'active') === 'active',
      displayOrder: displayOrder ?? 0,
    });
    await occasion.save();

    return ok({ occasion }, 201, 'Occasion created successfully');
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return fail('An occasion with this name or slug already exists', 400);
    }
    return serverError(error, 'Server error while creating occasion');
  }
}
