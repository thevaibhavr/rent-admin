import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Supercategory from '@/lib/models/Supercategory';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { uploadImage } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/auth';
import { validateCategoryBody } from '@/app/api/categories/validation';

export const dynamic = 'force-dynamic';

// GET /api/supercategories — Get all supercategories (public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const sp = request.nextUrl.searchParams;
    // Express echoes the raw query value back as currentPage (string when
    // provided, number 1 when defaulted) — preserved for byte-compatibility.
    const page: string | number = sp.get('page') ?? 1;
    const limit = Number(sp.get('limit') ?? 10);
    const sort = sp.get('sort') ?? 'sortOrder';
    const order = sp.get('order') ?? 'asc';

    const sortOptions: Record<string, 1 | -1> = { [sort]: order === 'desc' ? -1 : 1 };

    const supercategories = await Supercategory.find({ isActive: true })
      .sort(sortOptions)
      .limit(limit)
      .skip((Number(page) - 1) * limit)
      .exec();

    const total = await Supercategory.countDocuments({ isActive: true });

    return ok({
      supercategories,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    return serverError(error, 'Server error while fetching supercategories');
  }
}

// POST /api/supercategories — Create new supercategory (admin)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const errors = validateCategoryBody(body, false);
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const { name, description, image, sortOrder } = body as {
      name: string;
      description?: string;
      image: string;
      sortOrder?: number;
    };

    // Check if supercategory already exists
    const existingSupercategory = await Supercategory.findOne({ name });
    if (existingSupercategory) {
      return fail('Supercategory with this name already exists', 400);
    }

    // Upload image to Cloudinary if it's a base64 string
    let imageUrl = image;
    if (image.startsWith('data:image')) {
      const uploadResult = await uploadImage(image, 'beauty/supercategories');
      imageUrl = uploadResult.url;
    }

    const supercategory = new Supercategory({
      name,
      description,
      image: imageUrl,
      sortOrder: sortOrder || 0,
    });

    await supercategory.save();

    return ok({ supercategory }, 201, 'Supercategory created successfully');
  } catch (error) {
    return serverError(error, 'Server error while creating supercategory');
  }
}
