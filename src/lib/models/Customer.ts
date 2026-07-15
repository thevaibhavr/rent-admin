import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  mobile: string;
  email?: string;
  location?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
  };
  measurements?: {
    bust?: number;
    waist?: number;
    hips?: number;
    shoulder?: number;
    length?: number;
    size?: string;
  };
  avatar?: string;
  notes?: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  name: {
    type: String,
    required: [true, 'Please provide a customer name'],
    trim: true,
    maxlength: [100, 'Customer name cannot be more than 100 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Please provide mobile number'],
    trim: true,
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit mobile number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  location: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: { type: String },
    phone: { type: String }
  },
  measurements: {
    bust: { type: Number },
    waist: { type: Number },
    hips: { type: Number },
    shoulder: { type: Number },
    length: { type: Number },
    size: { type: String }
  },
  avatar: { type: String },
  notes: { type: String },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastBookingDate: { type: Date },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
customerSchema.index({ name: 'text', mobile: 'text', email: 'text' });

// Pre-save middleware to update search field
customerSchema.pre('save', function() {
  // Update total bookings and last booking date will be handled by booking creation
});

const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer;
