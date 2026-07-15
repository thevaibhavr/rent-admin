// Inline validation helpers mirroring the express-validator rules from
// rent-moment-backend/routes/categories.js and supercategories.js.

export type FieldError = {
  type: 'field';
  value: unknown;
  msg: string;
  path: string;
  location: 'body';
};

const INT_REGEX = /^[+-]?\d+$/;

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

// Mirrors the validator chains on POST / and PUT /:id for both categories and
// supercategories (identical rules; name is required on create only).
// Trim sanitizers mutate `body` the way express-validator mutates req.body.
export function validateCategoryBody(
  body: Record<string, unknown>,
  partial: boolean
): FieldError[] {
  const errors: FieldError[] = [];
  const push = (value: unknown, msg: string, path: string) =>
    errors.push({ type: 'field', value, msg, path, location: 'body' });

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : body.name;
    if (typeof name === 'string') body.name = name;
    if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
      push(body.name, 'Name must be between 2 and 50 characters', 'name');
    }
  }

  if (body.description !== undefined) {
    const description =
      typeof body.description === 'string' ? body.description.trim() : body.description;
    if (typeof description === 'string') body.description = description;
    if (typeof description !== 'string' || description.length > 200) {
      push(body.description, 'Description cannot be more than 200 characters', 'description');
    }
  }

  if (!partial) {
    const image = body.image;
    if (image === undefined || image === null || String(image).length === 0) {
      push(image, 'Image is required', 'image');
    }
  }

  if (body.sortOrder !== undefined && !isIntMin(body.sortOrder, 0)) {
    push(body.sortOrder, 'Sort order must be a positive integer', 'sortOrder');
  }

  if (partial && body.isActive !== undefined && !isBooleanValue(body.isActive)) {
    push(body.isActive, 'isActive must be a boolean', 'isActive');
  }

  return errors;
}
