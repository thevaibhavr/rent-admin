import type { Model } from 'mongoose';
import RoutineCategory from '@/lib/models/RoutineCategory';
import WinterCategory from '@/lib/models/WinterCategory';
import SummerCategory from '@/lib/models/SummerCategory';
import ClothCategory from '@/lib/models/ClothCategory';
import WomanCareCategory from '@/lib/models/WomanCareCategory';
import KidsCategory from '@/lib/models/KidsCategory';
import PerfumeCategory from '@/lib/models/PerfumeCategory';
import BeautyCategory from '@/lib/models/BeautyCategory';

// URL segment → model, preserving the legacy Express mount paths (server.js).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const categoryTypeModels: Record<string, Model<any>> = {
  'routine-categories': RoutineCategory,
  'winter-categories': WinterCategory,
  'summer-categories': SummerCategory,
  'cloth-categories': ClothCategory,
  'woman-care-categories': WomanCareCategory,
  'kids-categories': KidsCategory,
  'perfume-categories': PerfumeCategory,
  'beauty-categories': BeautyCategory,
};
