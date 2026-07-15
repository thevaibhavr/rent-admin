import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBeautyProductSize {
  size: string;
  isAvailable: boolean;
  quantity: number;
}

export interface IBeautyProduct extends Document {
  name: string;
  description: string;
  categories: Types.ObjectId[];
  images: string[];
  originalPrice: number;
  merchantPrice: number;
  mrp?: number;
  packOf: number;
  brand?: string;
  material?: string;
  color?: string;
  sizes: IBeautyProductSize[];
  tags: string[];
  searchKeywords: string[];
  stock: number;
  minDeliveryTime?: number;
  rating: number;
  ratingUsersNumber: number;
  isAvailable: boolean;
  isFeatured: boolean;
  slug?: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const beautyProductSchema = new Schema<IBeautyProduct>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true },
  categories: [{ type: Schema.Types.ObjectId, ref: 'BeautyCategory', required: true }],
  images: [{ type: String, required: true }],
  originalPrice: { type: Number, required: true, min: 0 },
  merchantPrice: { type: Number, required: true, min: 0 },
  mrp: { type: Number, min: 0 },
  packOf: { type: Number, required: true, min: 1 },
  brand: { type: String, trim: true },
  material: { type: String, trim: true },
  color: { type: String, trim: true },
  sizes: [{
    size: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, default: true },
    quantity: { type: Number, default: 0, min: 0 }
  }],
  tags: [{ type: String, trim: true }],
  searchKeywords: [{ type: String, trim: true }],
  stock: { type: Number, default: 0, min: 0 },
  minDeliveryTime: { type: Number, min: 1 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  ratingUsersNumber: { type: Number, min: 0, default: 0 },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  slug: { type: String, lowercase: true, unique: true, sparse: true },
  views: { type: Number, default: 0 }
}, { timestamps: true });

beautyProductSchema.pre('save', async function() {
  if (!this.isModified('name')) return;
  const baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let slug = baseSlug, counter = 1;
  while (true) {
    const existing = await (this.constructor as Model<IBeautyProduct>).findOne({ slug, _id: { $ne: this._id } });
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }
  this.slug = slug;
});

beautyProductSchema.index({ name: 'text', description: 'text', tags: 'text', searchKeywords: 'text' });

const BeautyProduct: Model<IBeautyProduct> = mongoose.models.BeautyProduct || mongoose.model<IBeautyProduct>('BeautyProduct', beautyProductSchema);

export default BeautyProduct;
