import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin, optionalAuth } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { uploadMultipleImages } from '@/lib/cloudinary';
import BeautyProduct from '@/lib/models/BeautyProduct';
import BeautyCategory from '@/lib/models/BeautyCategory';

export const dynamic = 'force-dynamic';

type FieldError = { type: 'field'; value: unknown; msg: string; path: string; location: 'body' };

const MONGO_ID = /^[0-9a-fA-F]{24}$/;

function isFloatMin(v: unknown, min: number, max?: number): boolean {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof v !== 'number' && typeof v !== 'string') return false;
  if (typeof n !== 'number' || !Number.isFinite(n)) return false;
  if (n < min) return false;
  if (max !== undefined && n > max) return false;
  return true;
}

function isIntMin(v: unknown, min: number): boolean {
  const n = typeof v === 'string' ? Number(v) : v;
  return (typeof v === 'number' || typeof v === 'string') && typeof n === 'number' && Number.isInteger(n) && n >= min;
}

function isBooleanLike(v: unknown): boolean {
  return typeof v === 'boolean' || v === 'true' || v === 'false';
}

// Mirrors the express-validator chain in routes/beautyProducts.js POST /
// (no .withMessage() in the source, so every message is the default 'Invalid value')
function validateCreateBody(body: Record<string, unknown>): FieldError[] {
  const errors: FieldError[] = [];
  const push = (path: string, value: unknown) =>
    errors.push({ type: 'field', value, msg: 'Invalid value', path, location: 'body' });

  // name: trim().isLength({ min: 2, max: 100 })
  if (typeof body.name === 'string') body.name = body.name.trim();
  if (typeof body.name !== 'string' || body.name.length < 2 || body.name.length > 100) {
    push('name', body.name);
  }

  // description: notEmpty()
  if (body.description === undefined || body.description === null || body.description === '') {
    push('description', body.description);
  }

  // categories: isArray({ min: 1 }); categories.*: isMongoId()
  if (!Array.isArray(body.categories) || body.categories.length < 1) {
    push('categories', body.categories);
  } else {
    body.categories.forEach((c, i) => {
      if (typeof c !== 'string' || !MONGO_ID.test(c)) push(`categories[${i}]`, c);
    });
  }

  // images: isArray({ min: 1 })
  if (!Array.isArray(body.images) || body.images.length < 1) {
    push('images', body.images);
  }

  // originalPrice / merchantPrice: isFloat({ min: 0 })
  if (!isFloatMin(body.originalPrice, 0)) push('originalPrice', body.originalPrice);
  if (!isFloatMin(body.merchantPrice, 0)) push('merchantPrice', body.merchantPrice);

  // mrp: optional().isFloat({ min: 0 })
  if (body.mrp !== undefined && !isFloatMin(body.mrp, 0)) push('mrp', body.mrp);

  // packOf: isInt({ min: 1 })
  if (!isIntMin(body.packOf, 1)) push('packOf', body.packOf);

  // brand / material / color: optional().trim() — sanitizers only, never error
  for (const key of ['brand', 'material', 'color'] as const) {
    if (typeof body[key] === 'string') body[key] = (body[key] as string).trim();
  }

  // sizes: isArray({ min: 1 }); sizes.*.size / isAvailable / quantity
  if (!Array.isArray(body.sizes) || body.sizes.length < 1) {
    push('sizes', body.sizes);
  } else {
    body.sizes.forEach((s: unknown, i: number) => {
      const size = s as Record<string, unknown> | null;
      const sizeVal = size && typeof size === 'object' ? size.size : undefined;
      if (typeof sizeVal !== 'string' || sizeVal.length < 1) push(`sizes[${i}].size`, sizeVal);
      const isAvailable = size && typeof size === 'object' ? size.isAvailable : undefined;
      if (isAvailable !== undefined && !isBooleanLike(isAvailable)) push(`sizes[${i}].isAvailable`, isAvailable);
      const quantity = size && typeof size === 'object' ? size.quantity : undefined;
      if (quantity !== undefined && !isIntMin(quantity, 0)) push(`sizes[${i}].quantity`, quantity);
    });
  }

  // tags: optional().isArray()
  if (body.tags !== undefined && !Array.isArray(body.tags)) push('tags', body.tags);

  // searchKeywords: optional().custom(array or string)
  if (body.searchKeywords !== undefined && !Array.isArray(body.searchKeywords) && typeof body.searchKeywords !== 'string') {
    push('searchKeywords', body.searchKeywords);
  }

  // stock: optional().isInt({ min: 0 })
  if (body.stock !== undefined && !isIntMin(body.stock, 0)) push('stock', body.stock);

  // minDeliveryTime: optional().isInt({ min: 1 })
  if (body.minDeliveryTime !== undefined && !isIntMin(body.minDeliveryTime, 1)) {
    push('minDeliveryTime', body.minDeliveryTime);
  }

  // rating: optional().isFloat({ min: 0, max: 5 })
  if (body.rating !== undefined && !isFloatMin(body.rating, 0, 5)) push('rating', body.rating);

  // ratingUsersNumber: optional().isInt({ min: 0 })
  if (body.ratingUsersNumber !== undefined && !isIntMin(body.ratingUsersNumber, 0)) {
    push('ratingUsersNumber', body.ratingUsersNumber);
  }

  // isFeatured: optional().isBoolean()
  if (body.isFeatured !== undefined && !isBooleanLike(body.isFeatured)) push('isFeatured', body.isFeatured);

  return errors;
}

// POST /api/beauty-products — Create beauty product (admin only)
export async function POST(request: NextRequest) {
  // Source used beautyAdmin (admin without a token) — replaced with strict admin auth
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const errors = validateCreateBody(body);
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const data = body as {
      name: string;
      description: string;
      categories: string[];
      images: string[];
      originalPrice: number;
      merchantPrice: number;
      mrp?: number;
      packOf: number;
      brand?: string;
      material?: string;
      color?: string;
      sizes: unknown[];
      tags?: unknown;
      searchKeywords?: unknown;
      stock?: number;
      minDeliveryTime?: number | string;
      rating?: number;
      ratingUsersNumber?: number;
      isFeatured?: boolean;
    };

    const uploadedImages: string[] = [];
    for (const image of data.images) {
      if (typeof image === 'string' && image.startsWith('data:image')) {
        const uploadResult = await uploadMultipleImages([image], 'beauty-products');
        uploadedImages.push(uploadResult[0].url);
      } else {
        uploadedImages.push(image);
      }
    }

    const product = new BeautyProduct({
      name: data.name,
      description: data.description,
      categories: data.categories,
      images: uploadedImages,
      originalPrice: data.originalPrice,
      merchantPrice: data.merchantPrice,
      mrp: data.mrp,
      packOf: data.packOf,
      brand: data.brand,
      material: data.material,
      color: data.color,
      sizes: data.sizes,
      tags: Array.isArray(data.tags) ? data.tags : [],
      searchKeywords: Array.isArray(data.searchKeywords)
        ? data.searchKeywords
        : (typeof data.searchKeywords === 'string'
            ? data.searchKeywords.split(',').map((s) => s.trim()).filter(Boolean)
            : []),
      stock: data.stock,
      minDeliveryTime: data.minDeliveryTime ? parseInt(String(data.minDeliveryTime)) : undefined,
      rating: data.rating,
      ratingUsersNumber: data.ratingUsersNumber,
      isFeatured: data.isFeatured || false,
    });

    await product.save();
    return ok({ product }, 201, 'Beauty product created successfully');
  } catch (error) {
    console.error('Create beauty product error:', error);
    const err = error as { code?: number; keyPattern?: { slug?: unknown } };
    if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
      return fail('A beauty product with this name already exists.', 400);
    }
    return fail('Server error while creating beauty product', 500);
  }
}

// GET /api/beauty-products — Get all beauty products with filtering and pagination (public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') ?? '1';
    const limit = searchParams.get('limit') ?? '12';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';
    const featured = searchParams.get('featured');

    const filter: Record<string, unknown> = { isAvailable: true };

    if (category) {
      let categoryId: unknown = category;

      // If not an ObjectId, try slug then name (case-insensitive)
      if (!category.match(MONGO_ID)) {
        let cat = await BeautyCategory.findOne({ slug: category, isActive: true });
        if (!cat) {
          cat = await BeautyCategory.findOne({ name: new RegExp(`^${category}$`, 'i'), isActive: true });
        }
        if (cat) {
          categoryId = cat._id;
        } else {
          return ok({
            products: [],
            totalPages: 0,
            currentPage: parseInt(page),
            total: 0,
            hasNextPage: false,
            hasPrevPage: false,
          });
        }
      }

      filter.categories = categoryId;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    const sortOptions: Record<string, 1 | -1> = { [sort]: order === 'desc' ? -1 : 1 };

    const products = await BeautyProduct.find(filter)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await BeautyProduct.countDocuments(filter);

    const user = await optionalAuth(request);
    if (user) {
      const ids = products.map((p) => p._id);
      await BeautyProduct.updateMany({ _id: { $in: ids } }, { $inc: { views: 1 } });
    }

    return ok({
      products,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: parseInt(page),
      total,
      hasNextPage: Number(page) * Number(limit) < total,
      hasPrevPage: Number(page) > 1,
    });
  } catch (error) {
    console.error('Get beauty products error:', error);
    return serverError(error, 'Server error while fetching beauty products');
  }
}
