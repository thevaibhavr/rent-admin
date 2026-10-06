import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Occasion from '@/lib/models/Occasion';
import '@/lib/models/Merchant';
import { optionalAuth } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { uploadMultipleImages } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/auth';
import { validateProductBody, duplicateKeyField } from './validation';

export const dynamic = 'force-dynamic';

const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// GET /api/products — Get all products with filtering and pagination (public)
export async function GET(request: NextRequest) {
  try {
    const user = await optionalAuth(request);
    await connectDB();

    const sp = request.nextUrl.searchParams;
    const page = Number(sp.get('page') ?? 1);
    const limit = Number(sp.get('limit') ?? 12);
    const category = sp.get('category');
    const search = sp.get('search');
    const minPrice = sp.get('minPrice');
    const maxPrice = sp.get('maxPrice');
    const size = sp.get('size');
    const color = sp.get('color');
    const sort = sp.get('sort') ?? 'createdAt';
    const order = sp.get('order') ?? 'desc';
    const featured = sp.get('featured');

    // Build filter object
    const filter: Record<string, unknown> = { isAvailable: true };

    if (category) {
      // First, try to find the category by slug to get the ID
      let categoryId: unknown = category;

      // Check if category is a slug (not a MongoDB ObjectId)
      if (!MONGO_ID_REGEX.test(category)) {
        const categoryDoc = await Category.findOne({ slug: category, isActive: true });
        if (categoryDoc) {
          categoryId = categoryDoc._id;
        } else {
          // If category slug not found, return empty results
          return ok({
            products: [],
            totalPages: 0,
            currentPage: page,
            total: 0,
            hasNextPage: false,
            hasPrevPage: false,
          });
        }
      }

      // Filter by categories array only (category field is for backward compatibility)
      filter.categories = categoryId;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      const price: Record<string, number> = {};
      if (minPrice) price.$gte = parseFloat(minPrice);
      if (maxPrice) price.$lte = parseFloat(maxPrice);
      filter.price = price;
    }

    if (size) {
      filter['sizes.size'] = size;
    }

    if (color) {
      filter.color = { $regex: color, $options: 'i' };
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    // Build sort object
    const sortOptions: Record<string, 1 | -1> = { [sort]: order === 'desc' ? -1 : 1 };

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .populate('occasions', 'name slug status')
      .populate('Owner', 'name mobilenumber address')
      .sort(sortOptions)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments(filter);

    // Increment views for each product
    if (user) {
      const productIds = products.map((product) => product._id);
      await Product.updateMany({ _id: { $in: productIds } }, { $inc: { views: 1 } });
    }

    return ok({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    return serverError(error, 'Server error while fetching products');
  }
}

// POST /api/products — Create new product (admin)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const errors = validateProductBody(body, false);
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const {
      name,
      description,
      categories,
      occasions,
      images,
      price,
      originalPrice,
      deposit,
      sizes,
      color,
      rentalDuration,
      condition,
      brand,
      material,
      tags,
      careInstructions,
      isFeatured,
      specifications,
    } = body;

    // Filter out null/undefined values from categories array
    const filteredCategories = (categories as unknown[]).filter(
      (categoryId) => categoryId && categoryId !== null && categoryId !== undefined
    );

    // Ensure at least one category is provided
    if (filteredCategories.length === 0) {
      return fail('At least one category is required', 400);
    }

    // Verify all categories exist
    for (const categoryId of filteredCategories) {
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return fail(`Category with ID ${categoryId} not found`, 400);
      }
    }

    const selectedOccasions = (occasions as unknown[] | undefined) ?? [];
    for (const occasionId of selectedOccasions) {
      const occasionExists = await Occasion.findById(occasionId);
      if (!occasionExists) {
        return fail(`Occasion with ID ${occasionId} not found`, 400);
      }
    }

    // Upload images to Cloudinary
    const uploadedImages: string[] = [];
    for (const image of images as string[]) {
      if (image.startsWith('data:image')) {
        const uploadResult = await uploadMultipleImages([image], 'products');
        uploadedImages.push(uploadResult[0].url);
      } else {
        uploadedImages.push(image);
      }
    }

    const product = new Product({
      name,
      description,
      categories: filteredCategories,
      occasions: selectedOccasions,
      images: uploadedImages,
      price,
      originalPrice,
      deposit,
      sizes,
      color,
      rentalDuration,
      condition: condition || 'Good',
      brand,
      material,
      tags: tags || [],
      careInstructions,
      isFeatured: isFeatured || false,
      specifications: specifications || {},
    });

    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .populate('occasions', 'name slug status')
      .populate('Owner', 'name mobilenumber address');

    return ok({ product: populatedProduct }, 201, 'Product created successfully');
  } catch (error) {
    console.error('Create product error:', error);

    // Handle duplicate key error specifically
    const field = duplicateKeyField(error);
    if (field) {
      if (field === 'slug') {
        return fail('A product with this name already exists. Please use a different name.', 400);
      }
      return fail(`Duplicate ${field} value. Please use a different ${field}.`, 400);
    }

    return fail('Server error while creating product', 500);
  }
}
