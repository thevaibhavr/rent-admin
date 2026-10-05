import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { fail, ok, serverError } from '@/lib/apiResponse';
import Occasion from '@/lib/models/Occasion';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const occasion = await Occasion.findOne({ slug });
    if (!occasion) {
      return fail('Occasion not found', 404);
    }

    return ok({ occasion });
  } catch (error) {
    return serverError(error, 'Server error while fetching occasion');
  }
}
