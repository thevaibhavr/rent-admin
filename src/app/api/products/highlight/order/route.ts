import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import { requireAdmin } from '@/lib/auth';
import { ok, fail, serverError } from '@/lib/apiResponse';
import { FieldError, isMongoIdValue, isIntMin } from '../../validation';

export const dynamic = 'force-dynamic';

// PUT /api/products/highlight/order — Update highlight order (private/admin)
// Note: this static segment takes precedence over highlight/[id], matching the
// Express router where PUT was only declared on /highlight/order.
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return fail(auth.error.message, auth.error.status);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const errors: FieldError[] = [];
    if (!Array.isArray(body.products)) {
      errors.push({
        type: 'field',
        value: body.products,
        msg: 'Products array is required',
        path: 'products',
        location: 'body',
      });
    } else {
      body.products.forEach((entry, index) => {
        const item = (entry ?? {}) as Record<string, unknown>;
        if (!isMongoIdValue(item.id)) {
          errors.push({
            type: 'field',
            value: item.id,
            msg: 'Valid product ID is required',
            path: `products[${index}].id`,
            location: 'body',
          });
        }
        if (!isIntMin(item.order, 1)) {
          errors.push({
            type: 'field',
            value: item.order,
            msg: 'Valid order number is required',
            path: `products[${index}].order`,
            location: 'body',
          });
        }
      });
    }

    if (errors.length > 0) {
      return fail('Validation errors', 400, errors);
    }

    await connectDB();

    const products = body.products as Array<{ id: string; order: number }>;

    // Update highlight order for each product
    for (const item of products) {
      await Product.findByIdAndUpdate(item.id, {
        highlightOrder: item.order,
      });
    }

    return ok(undefined, 200, 'Highlight order updated successfully');
  } catch (error) {
    return serverError(error, 'Server error while updating highlight order');
  }
}
