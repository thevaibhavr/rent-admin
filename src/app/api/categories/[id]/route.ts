import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { validateCategoryBody } from '../validation';

export const dynamic = 'force-dynamic';

// GET /api/categories/:id — Get single category (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const category = await Category.findById(id);

    if (!category) {
      return fail('Category not found', 404);
    }

    return ok({ category });
  } catch (error) {
    return serverError(error, 'Server error while fetching category');
  }
}

// PUT /api/categories/:id — Update category (private/admin)
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

    const errors = validateCategoryBody(body, true);
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const { name, description, image, sortOrder, isActive } = body as {
      name?: string;
      description?: string;
      image?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    const category = await Category.findById(id);
    if (!category) {
      return fail('Category not found', 404);
    }

    // Check if name is being changed and if it already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return fail('Category with this name already exists', 400);
      }
    }

    // Upload new image to Cloudinary if provided and it's a base64 string
    let imageUrl = category.image;
    if (image && image.startsWith('data:image')) {
      const uploadResult = await uploadImage(image, 'categories');
      imageUrl = uploadResult.url;
    } else if (image) {
      imageUrl = image;
    }

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (imageUrl) category.image = imageUrl;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    return ok({ category }, 200, 'Category updated successfully');
  } catch (error) {
    return serverError(error, 'Server error while updating category');
  }
}

// DELETE /api/categories/:id — Delete category (private/admin)
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

    const category = await Category.findById(id);

    if (!category) {
      return fail('Category not found', 404);
    }

    // Delete image from Cloudinary if it exists
    if (category.image && category.image.includes('cloudinary')) {
      try {
        const publicId = category.image.split('/').pop()!.split('.')[0];
        await deleteImage(publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    await Category.findByIdAndDelete(id);

    return ok(undefined, 200, 'Category deleted successfully');
  } catch (error) {
    return serverError(error, 'Server error while deleting category');
  }
}
