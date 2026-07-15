import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { uploadImage } from '@/lib/cloudinary';
import Supercategory from '@/lib/models/Supercategory';
import { getCategoryTypeConfig, validateCategoryBody, capitalize } from './lib';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ categoryType: string }> };

// GET /api/:categoryType — Get all active categories (public)
export async function GET(request: NextRequest, { params }: Params) {
  const { categoryType } = await params;
  const config = getCategoryTypeConfig(categoryType);
  if (!config) {
    return fail('Not found', 404);
  }

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') ?? 1;
    const limit = searchParams.get('limit') ?? 10;
    const sort = searchParams.get('sort') ?? 'sortOrder';
    const order = searchParams.get('order') ?? 'asc';

    const sortOptions: Record<string, 1 | -1> = { [sort]: order === 'desc' ? -1 : 1 };

    const query: Record<string, unknown> = { isActive: true };
    // Only the beauty-categories router supports filtering by supercategory
    if (config.hasSupercategory) {
      const supercategory = searchParams.get('supercategory');
      if (supercategory) {
        query.supercategory = supercategory;
      }
    }

    let find = config.model.find(query);
    if (config.hasSupercategory) {
      find = find.populate('supercategory', 'name slug');
    }
    const categories = await find
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await config.model.countDocuments(query);

    return ok({
      categories,
      totalPages: Math.ceil(total / Number(limit)),
      // Source echoes the raw query value (string) when provided, default number otherwise
      currentPage: page,
      total,
    });
  } catch (error) {
    return serverError(error, `Server error while fetching ${config.plural}`);
  }
}

// POST /api/:categoryType — Create new category (admin only)
export async function POST(request: NextRequest, { params }: Params) {
  const { categoryType } = await params;
  const config = getCategoryTypeConfig(categoryType);
  if (!config) {
    return fail('Not found', 404);
  }

  // Source used beautyAdmin (admin without a token) — replaced with strict admin auth
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const errors = validateCategoryBody(body, config, false);
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

    // BeautyCategory only: verify the referenced supercategory exists
    if (config.hasSupercategory) {
      const supercategoryExists = await Supercategory.findById(body.supercategory);
      if (!supercategoryExists) {
        return fail('Supercategory not found', 404);
      }
    }

    // Upload image to Cloudinary if it's a base64 string
    let imageUrl = image;
    if (image.startsWith('data:image')) {
      const uploadResult = await uploadImage(image, config.folder);
      imageUrl = uploadResult.url;
    }

    const doc: Record<string, unknown> = {
      name,
      description,
      image: imageUrl,
      sortOrder: sortOrder || 0,
    };
    if (config.hasSupercategory) {
      doc.supercategory = body.supercategory;
      doc.products = body.products || 0;
    }

    const category = new config.model(doc);
    await category.save();
    if (config.hasSupercategory) {
      await category.populate('supercategory', 'name slug');
    }

    return ok({ category }, 201, `${capitalize(config.singular)} created successfully`);
  } catch (error) {
    return serverError(error, `Server error while creating ${config.singular}`);
  }
}
