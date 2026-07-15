import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoutineCategory extends Document {
  name: string;
  description?: string;
  image: string;
  slug?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const routineCategorySchema = new Schema<IRoutineCategory>({
  name: {
    type: String,
    required: [true, 'Please provide a routine category name'],
    trim: true,
    maxlength: [50, 'Routine category name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  image: {
    type: String,
    required: [true, 'Please provide a routine category image']
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
routineCategorySchema.pre('save', function() {
  if (!this.isModified('name')) return;

  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
});

const RoutineCategory: Model<IRoutineCategory> = mongoose.models.RoutineCategory || mongoose.model<IRoutineCategory>('RoutineCategory', routineCategorySchema);

export default RoutineCategory;
