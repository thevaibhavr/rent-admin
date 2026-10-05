import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOccasion extends Document {
  name: string;
  description?: string;
  image: string;
  slug?: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const occasionSchema = new Schema<IOccasion>({
  name: {
    type: String,
    required: [true, 'Please provide an occasion name'],
    trim: true,
    unique: true,
    maxlength: [80, 'Occasion name cannot be more than 80 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot be more than 300 characters'],
  },
  image: {
    type: String,
    default: '',
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    sparse: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

occasionSchema.pre('validate', async function () {
  if (!this.isModified('name')) return;

  const baseSlug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'occasion';
  const existing = await mongoose.models.Occasion.findOne({
    slug: baseSlug,
    _id: { $ne: this._id },
  }).select('_id');

  this.slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
});

occasionSchema.pre('save', function () {
  if (this.isModified('status')) {
    this.isActive = this.status === 'active';
  }
});

const Occasion: Model<IOccasion> =
  mongoose.models.Occasion || mongoose.model<IOccasion>('Occasion', occasionSchema);

export default Occasion;
