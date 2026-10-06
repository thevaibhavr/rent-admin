import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Occasion from '@/lib/models/Occasion';
import '@/lib/models/Merchant';
import { optionalAuth, requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { uploadMultipleImages, deleteImage } from '@/lib/cloudinary';
import { validateProductBody, duplicateKeyField } from '../validation';

export const dynamic = 'force-dynamic';

// GET /api/products/:id — Get single product (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await optionalAuth(request);
    await connectDB();

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .populate('occasions', 'name slug status')
      .populate('Owner', 'name mobilenumber address');

    if (!product) {
      return fail('Product not found', 404);
    }

    if (!product.isAvailable) {
      return fail('Product is not available', 404);
    }

    // Increment views
    if (user) {
      product.views += 1;
      await product.save();
    }

    return ok({ product });
  } catch (error) {
    return serverError(error, 'Server error while fetching product');
  }
}

// PUT /api/products/:id — Update product (private/admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const errors = validateProductBody(body, true);
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const product = await Product.findById(id);
    if (!product) {
      return fail('Product not found', 404);
    }

    // Verify all categories exist if being updated
    if (body.categories) {
      // Filter out null/undefined values from categories array
      body.categories = (body.categories as unknown[]).filter(
        (categoryId) => categoryId && categoryId !== null && categoryId !== undefined
      );

      // Ensure at least one category is provided
      if ((body.categories as unknown[]).length === 0) {
        return fail('At least one category is required', 400);
      }

      for (const categoryId of body.categories as unknown[]) {
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
          return fail(`Category with ID ${categoryId} not found`, 400);
        }
      }
    }

    if (body.occasions !== undefined) {
      for (const occasionId of body.occasions as unknown[]) {
        const occasionExists = await Occasion.findById(occasionId);
        if (!occasionExists) {
          return fail(`Occasion with ID ${occasionId} not found`, 400);
        }
      }
    }

    // Handle image uploads if provided
    if (body.images) {
      const uploadedImages: string[] = [];
      for (const image of body.images as string[]) {
        if (image.startsWith('data:image')) {
          const uploadResult = await uploadMultipleImages([image], 'products');
          uploadedImages.push(uploadResult[0].url);
        } else {
          uploadedImages.push(image);
        }
      }
      body.images = uploadedImages;
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(id, body, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate('category', 'name slug')
      .populate('categories', 'name slug')
      .populate('occasions', 'name slug status')
      .populate('Owner', 'name mobilenumber address');

    return ok({ product: updatedProduct }, 200, 'Product updated successfully');
  } catch (error) {
    console.error('Update product error:', error);

    // Handle duplicate key error specifically
    const field = duplicateKeyField(error);
    if (field) {
      if (field === 'slug') {
        return fail('A product with this name already exists. Please use a different name.', 400);
      }
      return fail(`Duplicate ${field} value. Please use a different ${field}.`, 400);
    }

    return fail('Server error while updating product', 500);
  }
}

// DELETE /api/products/:id — Delete product (private/admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id);

    if (!product) {
      return fail('Product not found', 404);
    }

    // Delete images from Cloudinary
    for (const image of product.images) {
      if (image.includes('cloudinary')) {
        try {
          const publicId = image.split('/').pop()!.split('.')[0];
          await deleteImage(publicId);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }
    }

    await Product.findByIdAndDelete(id);

    return ok(undefined, 200, 'Product deleted successfully');
  } catch (error) {
    return serverError(error, 'Server error while deleting product');
  }
}
