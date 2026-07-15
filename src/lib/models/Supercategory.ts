import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISupercategory extends Document {
  name: string;
  description?: string;
  image: string;
  slug?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const supercategorySchema = new Schema<ISupercategory>({
  name: {
    type: String,
    required: [true, 'Please provide a supercategory name'],
    trim: true,
    unique: true,
    maxlength: [50, 'Supercategory name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  image: {
    type: String,
    required: [true, 'Please provide a supercategory image']
  },
  slug: {
    type: String,
    unique: true,
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
supercategorySchema.pre('save', function() {
  if (!this.isModified('name')) return;

  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
});

const Supercategory: Model<ISupercategory> = mongoose.models.Supercategory || mongoose.model<ISupercategory>('Supercategory', supercategorySchema);

export default Supercategory;
