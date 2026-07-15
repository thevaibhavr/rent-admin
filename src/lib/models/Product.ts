import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProductSize {
  size: string;
  isAvailable: boolean;
  quantity: number;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  categories: Types.ObjectId[];
  Owner?: Types.ObjectId;
  category?: Types.ObjectId;
  images: string[];
  price?: number;
  originalPrice: number;
  merchantPrice?: number;
  packOf?: number;
  sizes: IProductSize[];
  color?: string;
  brand?: string;
  material?: string;
  condition: 'Excellent' | 'Very Good' | 'Good' | 'Fair';
  rentalDuration?: number;
  isAvailable: boolean;
  deposit?: number;
  isFeatured: boolean;
  isHighlighted: boolean;
  highlightOrder: number;
  tags: string[];
  specifications?: Map<string, string>;
  careInstructions?: string;
  slug?: string;
  views: number;
  rating: number;
  numReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    trim: true
  },
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide at least one category']
  }],
  Owner: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant'
  },
  // Keep category for backward compatibility (will be populated from first category in categories array)
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  images: [{
    type: String,
    required: [true, 'Please provide at least one product image']
  }],
  price: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Please provide the original price'],
    min: [0, 'Original price cannot be negative']
  },
  merchantPrice: {
    type: Number,
    min: [0, 'Merchant price cannot be negative']
  },
  packOf: {
    type: Number,
    min: [1, 'Pack of must be at least 1']
  },
  sizes: [{
    size: {
      type: String,
      required: true,
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: [0, 'Quantity cannot be negative']
    }
  }],
  color: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  material: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Very Good', 'Good', 'Fair'],
    default: 'Good'
  },
  rentalDuration: {
    type: Number,
    min: [1, 'Rental duration must be at least 1 day']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  deposit: {
    type: Number
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  highlightOrder: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  careInstructions: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    lowercase: true,
    unique: true,
    sparse: true
  },
  views: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Set category from first category in categories array for backward compatibility
productSchema.pre('save', async function() {
  if (this.categories && this.categories.length > 0) {
    this.category = this.categories[0];
  }
});

// Generate slug from name before saving
productSchema.pre('save', async function() {
  if (!this.isModified('name')) return;

  const baseSlug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if slug already exists
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingProduct = await (this.constructor as Model<IProduct>).findOne({
      slug: slug,
      _id: { $ne: this._id } // Exclude current document if updating
    });

    if (!existingProduct) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;
});

// Index for search functionality
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;
