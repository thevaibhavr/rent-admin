import type { Model } from 'mongoose';
import { categoryTypeModels } from '@/lib/categoryTypes';

// express-validator error item shape, mirrored byte-for-byte
export type FieldError = { type: 'field'; value: unknown; msg: string; path: string; location: 'body' };

export interface CategoryTypeConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>;
  /** Lowercase singular noun used in messages, e.g. 'winter category' */
  singular: string;
  /** Lowercase plural noun used in messages, e.g. 'winter categories' */
  plural: string;
  /** Cloudinary upload folder */
  folder: string;
  /** BeautyCategory is the only clone with a supercategory ref + products count */
  hasSupercategory: boolean;
}

const nouns: Record<string, { singular: string; plural: string; folder: string; hasSupercategory?: boolean }> = {
  'routine-categories': { singular: 'routine category', plural: 'routine categories', folder: 'beauty/routine-categories' },
  'winter-categories': { singular: 'winter category', plural: 'winter categories', folder: 'beauty/winter-categories' },
  'summer-categories': { singular: 'summer category', plural: 'summer categories', folder: 'beauty/summer-categories' },
  'cloth-categories': { singular: 'cloth category', plural: 'cloth categories', folder: 'beauty/cloth-categories' },
  'woman-care-categories': { singular: 'woman care category', plural: 'woman care categories', folder: 'beauty/woman-care-categories' },
  'kids-categories': { singular: 'kids category', plural: 'kids categories', folder: 'beauty/kids-categories' },
  'perfume-categories': { singular: 'perfume category', plural: 'perfume categories', folder: 'beauty/perfume-categories' },
  'beauty-categories': { singular: 'beauty category', plural: 'beauty categories', folder: 'beauty/categories', hasSupercategory: true },
};

export function getCategoryTypeConfig(categoryType: string): CategoryTypeConfig | null {
  const model = categoryTypeModels[categoryType];
  const noun = nouns[categoryType];
  if (!model || !noun) return null;
  return {
    model,
    singular: noun.singular,
    plural: noun.plural,
    folder: noun.folder,
    hasSupercategory: noun.hasSupercategory === true,
  };
}

/** 'winter category' -> 'Winter category' */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isIntMin(value: unknown, min: number): boolean {
  const n = typeof value === 'string' ? Number(value) : value;
  return (typeof value === 'number' || typeof value === 'string') && typeof n === 'number' && Number.isInteger(n) && n >= min;
}

// Mirrors the express-validator chains shared by all eight clone routers.
// `isUpdate` makes name/image optional (PUT chain) and enables isActive.
export function validateCategoryBody(
  body: Record<string, unknown>,
  config: CategoryTypeConfig,
  isUpdate: boolean
): FieldError[] {
  const errors: FieldError[] = [];
  const push = (path: string, value: unknown, msg: string) =>
    errors.push({ type: 'field', value, msg, path, location: 'body' });

  // name: trim().isLength({ min: 2, max: 50 })
  if (typeof body.name === 'string') body.name = body.name.trim();
  const name = body.name;
  if (isUpdate) {
    if (name !== undefined && (typeof name !== 'string' || name.length < 2 || name.length > 50)) {
      push('name', name, 'Name must be between 2 and 50 characters');
    }
  } else if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
    push('name', name, 'Name must be between 2 and 50 characters');
  }

  // description: optional().trim().isLength({ max: 200 })
  if (body.description !== undefined) {
    if (typeof body.description === 'string') body.description = body.description.trim();
    if (typeof body.description !== 'string' || body.description.length > 200) {
      push('description', body.description, 'Description cannot be more than 200 characters');
    }
  }

  // image: notEmpty() on create, optional() on update
  if (!isUpdate) {
    const image = body.image;
    if (image === undefined || image === null || image === '') {
      push('image', image, 'Image is required');
    }
  }

  // supercategory (BeautyCategory only): notEmpty() on create, optional() on update
  if (config.hasSupercategory && !isUpdate) {
    const supercategory = body.supercategory;
    if (supercategory === undefined || supercategory === null || supercategory === '') {
      push('supercategory', supercategory, 'Supercategory is required');
    }
  }

  // sortOrder: optional().isInt({ min: 0 })
  if (body.sortOrder !== undefined && !isIntMin(body.sortOrder, 0)) {
    push('sortOrder', body.sortOrder, 'Sort order must be a positive integer');
  }

  // isActive: optional().isBoolean() — PUT chain only
  if (isUpdate && body.isActive !== undefined) {
    const v = body.isActive;
    if (typeof v !== 'boolean' && v !== 'true' && v !== 'false') {
      push('isActive', v, 'isActive must be a boolean');
    }
  }

  // products (BeautyCategory only): optional().isInt({ min: 0 })
  if (config.hasSupercategory && body.products !== undefined && !isIntMin(body.products, 0)) {
    push('products', body.products, 'Products count must be a positive integer');
  }

  return errors;
}

// Mirrors the source routers' Cloudinary public_id extraction for old-image cleanup
export function extractCloudinaryPublicId(imageUrl: string): string {
  return imageUrl.split('/').slice(-2).join('/').split('.')[0];
}
