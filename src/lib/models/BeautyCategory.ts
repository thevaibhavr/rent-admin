import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBeautyCategory extends Document {
  name: string;
  description?: string;
  image: string;
  supercategory: Types.ObjectId;
  slug?: string;
  isActive: boolean;
  sortOrder: number;
  products: number;
  createdAt: Date;
  updatedAt: Date;
}

const beautyCategorySchema = new Schema<IBeautyCategory>({
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  image: {
    type: String,
    required: [true, 'Please provide a category image']
  },
  supercategory: {
    type: Schema.Types.ObjectId,
    ref: 'Supercategory',
    required: [true, 'Please provide a supercategory']
  },
  slug: {
    type: String,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  products: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
beautyCategorySchema.pre('save', function() {
  if (!this.isModified('name')) return;

  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
});

// Index for faster queries
beautyCategorySchema.index({ supercategory: 1, isActive: 1 });

const BeautyCategory: Model<IBeautyCategory> = mongoose.models.BeautyCategory || mongoose.model<IBeautyCategory>('BeautyCategory', beautyCategorySchema);

export default BeautyCategory;
