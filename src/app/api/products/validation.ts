// Inline validation helpers mirroring the express-validator rules from
// rent-moment-backend/routes/products.js. Error objects follow the
// express-validator v7 shape: { type, value, msg, path, location }.

export type FieldError = {
  type: 'field';
  value: unknown;
  msg: string;
  path: string;
  location: 'body';
};

const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const FLOAT_REGEX = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;
const INT_REGEX = /^[+-]?\d+$/;

export function isMongoIdValue(value: unknown): boolean {
  return typeof value === 'string' && MONGO_ID_REGEX.test(value);
}

export function isFloatMin(value: unknown, min: number): boolean {
  if (typeof value !== 'number' && typeof value !== 'string') return false;
  const str = String(value);
  if (!FLOAT_REGEX.test(str)) return false;
  return parseFloat(str) >= min;
}

export function isIntMin(value: unknown, min: number): boolean {
  if (typeof value !== 'number' && typeof value !== 'string') return false;
  const str = String(value);
  if (!INT_REGEX.test(str)) return false;
  return parseInt(str, 10) >= min;
}

export function isBooleanValue(value: unknown): boolean {
  return (
    typeof value === 'boolean' ||
    value === 'true' ||
    value === 'false' ||
    value === '0' ||
    value === '1'
  );
}

export function isNotEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  return String(value).length > 0;
}

const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const VALID_CONDITIONS = ['Excellent', 'Very Good', 'Good', 'Fair'];

// Mirrors the validator chains on POST /api/products (partial = false) and
// PUT /api/products/:id (partial = true, every rule marked .optional()).
// Trim sanitizers mutate `body` the way express-validator mutates req.body.
export function validateProductBody(
  body: Record<string, unknown>,
  partial: boolean
): FieldError[] {
  const errors: FieldError[] = [];
  const push = (value: unknown, msg: string, path: string) =>
    errors.push({ type: 'field', value, msg, path, location: 'body' });
  const check = (key: string) => !partial || body[key] !== undefined;

  if (check('name')) {
    const name = typeof body.name === 'string' ? body.name.trim() : body.name;
    if (typeof name === 'string') body.name = name;
    if (typeof name !== 'string' || name.length < 2 || name.length > 100) {
      push(body.name, 'Name must be between 2 and 100 characters', 'name');
    }
  }

  if (check('description') && !isNotEmpty(body.description)) {
    push(
      body.description,
      partial ? 'Description cannot be empty' : 'Description is required',
      'description'
    );
  }

  if (check('categories')) {
    if (!Array.isArray(body.categories) || body.categories.length < 1) {
      push(body.categories, 'At least one category is required', 'categories');
    }
    if (Array.isArray(body.categories)) {
      body.categories.forEach((categoryId, index) => {
        if (partial && categoryId === undefined) return;
        if (!isMongoIdValue(categoryId)) {
          push(categoryId, 'Valid category ID is required', `categories[${index}]`);
        }
      });
    }
  }

  if (check('images') && (!Array.isArray(body.images) || body.images.length < 1)) {
    push(body.images, 'At least one image is required', 'images');
  }

  if (check('price') && !isFloatMin(body.price, 0)) {
    push(body.price, 'Price must be a positive number', 'price');
  }

  if (check('originalPrice') && !isFloatMin(body.originalPrice, 0)) {
    push(body.originalPrice, 'Original price must be a positive number', 'originalPrice');
  }

  if (body.deposit !== undefined && !isFloatMin(body.deposit, 0)) {
    push(body.deposit, 'Deposit must be a positive number', 'deposit');
  }

  if (body.Owner !== undefined && !isMongoIdValue(body.Owner)) {
    push(body.Owner, 'Valid merchant ID is required', 'Owner');
  }

  if (check('sizes') && (!Array.isArray(body.sizes) || body.sizes.length < 1)) {
    push(body.sizes, 'At least one size is required', 'sizes');
  }
  if (Array.isArray(body.sizes)) {
    body.sizes.forEach((entry, index) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      if (!(partial && item.size === undefined)) {
        if (typeof item.size !== 'string' || !VALID_SIZES.includes(item.size)) {
          push(item.size, 'Valid size is required', `sizes[${index}].size`);
        }
      }
      if (!(partial && item.isAvailable === undefined)) {
        if (!isBooleanValue(item.isAvailable)) {
          push(item.isAvailable, 'Size availability must be boolean', `sizes[${index}].isAvailable`);
        }
      }
      if (!(partial && item.quantity === undefined)) {
        if (!isIntMin(item.quantity, 1)) {
          push(item.quantity, 'Size quantity must be at least 1', `sizes[${index}].quantity`);
        }
      }
    });
  }

  if (check('color') && !isNotEmpty(body.color)) {
    push(body.color, partial ? 'Color cannot be empty' : 'Color is required', 'color');
  }

  if (check('rentalDuration') && !isIntMin(body.rentalDuration, 1)) {
    push(body.rentalDuration, 'Rental duration must be at least 1 day', 'rentalDuration');
  }

  if (
    body.condition !== undefined &&
    (typeof body.condition !== 'string' || !VALID_CONDITIONS.includes(body.condition))
  ) {
    push(body.condition, 'Invalid value', 'condition');
  }

  if (body.brand !== undefined && typeof body.brand === 'string') {
    body.brand = body.brand.trim();
  }
  if (body.material !== undefined && typeof body.material === 'string') {
    body.material = body.material.trim();
  }

  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    push(body.tags, 'Invalid value', 'tags');
  }

  if (body.careInstructions !== undefined && typeof body.careInstructions === 'string') {
    body.careInstructions = body.careInstructions.trim();
  }

  if (body.isFeatured !== undefined && !isBooleanValue(body.isFeatured)) {
    push(body.isFeatured, 'Invalid value', 'isFeatured');
  }

  if (partial && body.isAvailable !== undefined && !isBooleanValue(body.isAvailable)) {
    push(body.isAvailable, 'Invalid value', 'isAvailable');
  }

  return errors;
}

// Mongo duplicate-key error info, mirroring the Express handlers.
export function duplicateKeyField(error: unknown): string | null {
  const err = error as { code?: number; keyPattern?: Record<string, unknown> };
  if (err && err.code === 11000 && err.keyPattern) {
    return Object.keys(err.keyPattern)[0] ?? null;
  }
  return null;
}
