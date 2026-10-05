import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { fail, ok, serverError } from '@/lib/apiResponse';
import { deleteImage, uploadImage } from '@/lib/cloudinary';
import Occasion from '@/lib/models/Occasion';
import { validateOccasionBody } from '../validation';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();

    const occasion = await Occasion.findById(id);
    if (!occasion) {
      return fail('Occasion not found', 404);
    }

    return ok({ occasion });
  } catch (error) {
    return serverError(error, 'Server error while fetching occasion');
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const errors = validateOccasionBody(body, true);
    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const occasion = await Occasion.findById(id);
    if (!occasion) {
      return fail('Occasion not found', 404);
    }

    const { name, description, image, status, displayOrder } = body as {
      name?: string;
      description?: string;
      image?: string;
      status?: 'active' | 'inactive';
      displayOrder?: number;
    };

    if (name && name.toLowerCase() !== occasion.name.toLowerCase()) {
      const existingOccasion = await Occasion.findOne({
        name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        _id: { $ne: occasion._id },
      });
      if (existingOccasion) {
        return fail('An occasion with this name already exists', 400);
      }
    }

    if (name !== undefined) occasion.name = name;
    if (description !== undefined) occasion.description = description;
    if (image !== undefined) {
      if (image.startsWith('data:image')) {
        const uploadResult = await uploadImage(image, 'occasions');
        occasion.image = uploadResult.url;
      } else {
        occasion.image = image;
      }
    }
    if (status !== undefined) occasion.status = status;
    if (displayOrder !== undefined) occasion.displayOrder = displayOrder;

    await occasion.save();

    return ok({ occasion }, 200, 'Occasion updated successfully');
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return fail('An occasion with this name or slug already exists', 400);
    }
    return serverError(error, 'Server error while updating occasion');
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(_request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const { id } = await params;
    await connectDB();

    const occasion = await Occasion.findById(id);
    if (!occasion) {
      return fail('Occasion not found', 404);
    }

    if (occasion.image.includes('cloudinary')) {
      try {
        const publicId = occasion.image.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(publicId);
      } catch (error) {
        console.error('Error deleting occasion image from Cloudinary:', error);
      }
    }

    await Occasion.findByIdAndDelete(id);
    return ok(undefined, 200, 'Occasion deleted successfully');
  } catch (error) {
    return serverError(error, 'Server error while deleting occasion');
  }
}
