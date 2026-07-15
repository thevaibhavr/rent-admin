import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Supercategory from '@/lib/models/Supercategory';
import BeautyCategory from '@/lib/models/BeautyCategory';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/auth';
import { validateCategoryBody } from '@/app/api/categories/validation';

export const dynamic = 'force-dynamic';

// GET /api/supercategories/:id — Get single supercategory (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const supercategory = await Supercategory.findById(id);

    if (!supercategory) {
      return fail('Supercategory not found', 404);
    }

    return ok({ supercategory });
  } catch (error) {
    return serverError(error, 'Server error while fetching supercategory');
  }
}

// PUT /api/supercategories/:id — Update supercategory (admin)
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

    const supercategory = await Supercategory.findById(id);
    if (!supercategory) {
      return fail('Supercategory not found', 404);
    }

    // Check if name is being changed and if it already exists
    if (name && name !== supercategory.name) {
      const existingSupercategory = await Supercategory.findOne({ name });
      if (existingSupercategory) {
        return fail('Supercategory with this name already exists', 400);
      }
    }

    // Upload new image to Cloudinary if provided and it's a base64 string
    let imageUrl = supercategory.image;
    if (image && image.startsWith('data:image')) {
      // Delete old image if it exists on Cloudinary
      if (supercategory.image && supercategory.image.includes('cloudinary')) {
        try {
          const publicId = supercategory.image.split('/').slice(-2).join('/').split('.')[0];
          await deleteImage(publicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      const uploadResult = await uploadImage(image, 'beauty/supercategories');
      imageUrl = uploadResult.url;
    } else if (image) {
      imageUrl = image;
    }

    // Update fields
    if (name) supercategory.name = name;
    if (description !== undefined) supercategory.description = description;
    if (imageUrl) supercategory.image = imageUrl;
    if (sortOrder !== undefined) supercategory.sortOrder = sortOrder;
    if (isActive !== undefined) supercategory.isActive = isActive;

    await supercategory.save();

    return ok({ supercategory }, 200, 'Supercategory updated successfully');
  } catch (error) {
    return serverError(error, 'Server error while updating supercategory');
  }
}

// DELETE /api/supercategories/:id — Delete supercategory (admin)
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

    const supercategory = await Supercategory.findById(id);

    if (!supercategory) {
      return fail('Supercategory not found', 404);
    }

    // Check if supercategory has categories
    const categoryCount = await BeautyCategory.countDocuments({
      supercategory: supercategory._id,
    });
    if (categoryCount > 0) {
      return fail('Cannot delete supercategory with existing categories', 400);
    }

    // Delete image from Cloudinary if it exists
    if (supercategory.image && supercategory.image.includes('cloudinary')) {
      try {
        const publicId = supercategory.image.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    await Supercategory.findByIdAndDelete(id);

    return ok(undefined, 200, 'Supercategory deleted successfully');
  } catch (error) {
    return serverError(error, 'Server error while deleting supercategory');
  }
}
