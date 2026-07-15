import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPerfumeCategory extends Document {
  name: string;
  description?: string;
  image: string;
  slug?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const perfumeCategorySchema = new Schema<IPerfumeCategory>({
  name: {
    type: String,
    required: [true, 'Please provide a perfume category name'],
    trim: true,
    maxlength: [50, 'Perfume category name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  image: {
    type: String,
    required: [true, 'Please provide a perfume category image']
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
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
perfumeCategorySchema.pre('save', function() {
  if (!this.isModified('name')) return;

  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
});

const PerfumeCategory: Model<IPerfumeCategory> = mongoose.models.PerfumeCategory || mongoose.model<IPerfumeCategory>('PerfumeCategory', perfumeCategorySchema);

export default PerfumeCategory;
