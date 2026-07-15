import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ok, fail } from '@/lib/apiResponse';
import { uploadImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// POST /api/upload/image — Upload single image to Cloudinary (private)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { image?: string; folder?: string };
    const { image, folder = 'clothing-rental' } = body;

    if (!image) {
      return fail('Image data is required', 400);
    }

    const uploadResult = await uploadImage(image, folder);

    return ok(
      { url: uploadResult.url, public_id: uploadResult.public_id },
      200,
      'Image uploaded successfully'
    );
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error && error.message ? error.message : 'Image upload failed';
    return fail(message, 500);
  }
}
