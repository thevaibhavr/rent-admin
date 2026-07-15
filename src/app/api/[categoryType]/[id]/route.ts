import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import Supercategory from '@/lib/models/Supercategory';
import { getCategoryTypeConfig, validateCategoryBody, capitalize, extractCloudinaryPublicId } from '../lib';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ categoryType: string; id: string }> };

// GET /api/:categoryType/:id — Get single category (public)
export async function GET(request: NextRequest, { params }: Params) {
  const { categoryType, id } = await params;
  const config = getCategoryTypeConfig(categoryType);
  if (!config) {
    return fail('Not found', 404);
  }

  try {
    await connectDB();

    let query = config.model.findById(id);
    if (config.hasSupercategory) {
      query = query.populate('supercategory', 'name slug');
    }
    const category = await query;

    if (!category) {
      return fail(`${capitalize(config.singular)} not found`, 404);
    }

    return ok({ category });
  } catch (error) {
    return serverError(error, `Server error while fetching ${config.singular}`);
  }
}

// PUT /api/:categoryType/:id — Update category (admin only)
export async function PUT(request: NextRequest, { params }: Params) {
  const { categoryType, id } = await params;
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

    const errors = validateCategoryBody(body, config, true);
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

    const category = await config.model.findById(id);
    if (!category) {
      return fail(`${capitalize(config.singular)} not found`, 404);
    }

    // BeautyCategory only: verify supercategory exists if being changed
    if (config.hasSupercategory && body.supercategory && body.supercategory !== category.supercategory?.toString()) {
      const supercategoryExists = await Supercategory.findById(body.supercategory);
      if (!supercategoryExists) {
        return fail('Supercategory not found', 404);
      }
    }

    // Upload new image to Cloudinary if provided and it's a base64 string
    let imageUrl: string | undefined = category.image;
    if (image && image.startsWith('data:image')) {
      // Delete old image if it exists on Cloudinary
      if (category.image && category.image.includes('cloudinary')) {
        try {
          await deleteImage(extractCloudinaryPublicId(category.image));
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      const uploadResult = await uploadImage(image, config.folder);
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
    if (config.hasSupercategory) {
      if (body.supercategory) category.supercategory = body.supercategory;
      if (body.products !== undefined) category.products = body.products;
    }

    await category.save();
    if (config.hasSupercategory) {
      await category.populate('supercategory', 'name slug');
    }

    return ok({ category }, 200, `${capitalize(config.singular)} updated successfully`);
  } catch (error) {
    return serverError(error, `Server error while updating ${config.singular}`);
  }
}

// DELETE /api/:categoryType/:id — Delete category (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  const { categoryType, id } = await params;
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
    await connectDB();

    const category = await config.model.findById(id);
    if (!category) {
      return fail(`${capitalize(config.singular)} not found`, 404);
    }

    // Delete image from Cloudinary if it exists
    if (category.image && category.image.includes('cloudinary')) {
      try {
        await deleteImage(extractCloudinaryPublicId(category.image));
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    await config.model.findByIdAndDelete(id);

    return ok(undefined, 200, `${capitalize(config.singular)} deleted successfully`);
  } catch (error) {
    return serverError(error, `Server error while deleting ${config.singular}`);
  }
}
