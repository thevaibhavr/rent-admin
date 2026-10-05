import type { FieldError } from '@/app/api/categories/validation';

export function validateOccasionBody(
  body: Record<string, unknown>,
  partial: boolean
): FieldError[] {
  const errors: FieldError[] = [];
  const push = (value: unknown, msg: string, path: string) =>
    errors.push({ type: 'field', value, msg, path, location: 'body' });

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : body.name;
    if (typeof name === 'string') body.name = name;
    if (typeof name !== 'string' || name.length < 2 || name.length > 80) {
      push(body.name, 'Name must be between 2 and 80 characters', 'name');
    }
  }

  if (body.description !== undefined) {
    const description =
      typeof body.description === 'string' ? body.description.trim() : body.description;
    if (typeof description === 'string') body.description = description;
    if (typeof description !== 'string' || description.length > 300) {
      push(body.description, 'Description cannot be more than 300 characters', 'description');
    }
  }

  if (body.image !== undefined && typeof body.image !== 'string') {
    push(body.image, 'Image must be a string', 'image');
  }

  if (
    body.status !== undefined &&
    body.status !== 'active' &&
    body.status !== 'inactive'
  ) {
    push(body.status, 'Status must be active or inactive', 'status');
  }

  if (body.displayOrder !== undefined) {
    const value = body.displayOrder;
    const isValid =
      (typeof value === 'number' && Number.isInteger(value) && value >= 0) ||
      (typeof value === 'string' && /^\d+$/.test(value));
    if (!isValid) {
      push(value, 'Display order must be a non-negative integer', 'displayOrder');
    } else {
      body.displayOrder = Number(value);
    }
  }

  return errors;
}
