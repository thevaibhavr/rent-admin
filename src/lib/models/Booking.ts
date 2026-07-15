import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';

export interface IBookingCustomer {
  name: string;
  image?: string;
  location?: string;
  mobile?: string;
  email?: string;
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
}

export interface IBookingAdditionalCost {
  reason?: string;
  amount: number;
}

export interface IBookingItem {
  dressId: Types.ObjectId;
  priceAfterBargain: number;

  // Payment tracking
  bookingAmount: number;
  advance: number;
  pending: number;
  finalPayment: number;
  totalPaid: number;

  securityAmount: number;

  // Additional costs
  additionalCosts?: IBookingAdditionalCost[];

  // Transport & Delivery
  sendDate?: Date;
  deliveryMethod?: 'parcel' | 'bus' | 'courier' | 'hand_delivery' | 'other';
  transportCost: number;
  transportPaidBy: 'business' | 'customer';

  // Usage & Return
  receiveDate?: Date;
  dressImage?: string;
  useDress?: string;
  useDressDate?: Date;
  useDressTime?: 'morning' | 'evening';

  // Processing & Quality Check
  dryCleaningCost: number;
  conditionOnReturn: 'excellent' | 'very_good' | 'good' | 'fair' | 'damaged' | 'lost';
  damageDescription?: string;
  repairCost: number;
  isRepairable: boolean;

  // Financial calculations
  totalCost: number;
  profit: number;
  status: 'booked' | 'paid' | 'sent' | 'delivered' | 'in_use' | 'returned' | 'processing' | 'completed' | 'damaged' | 'lost';
}

export interface IBooking extends Document {
  bookingId: string;
  items: IBookingItem[];

  // Legacy fields for backward compatibility
  dressId?: Types.ObjectId;
  priceAfterBargain?: number;
  advance: number;
  pending: number;
  securityAmount: number;
  sendDate?: Date;
  receiveDate?: Date;
  dressImage?: string;

  // Common fields
  customer: IBookingCustomer;
  referenceCustomer?: string;

  // Workflow status
  status: 'active' | 'completed' | 'canceled';
  canceledAt?: Date;
  cancelReason?: string;

  // Financial summaries (auto-calculated)
  totalPrice: number;
  totalBookingAmount: number;
  totalAdvance: number;
  totalFinalPayment: number;
  totalPaid: number;
  totalPending: number;
  totalSecurity: number;

  // Cost tracking
  totalTransportCost: number;
  totalDryCleaningCost: number;
  totalRepairCost: number;
  totalOperationalCost: number;

  // Profit/Loss calculation
  grossProfit: number;
  netProfit: number;

  // Workflow milestones
  workflowStage: 'booking' | 'payment' | 'delivery' | 'usage' | 'return' | 'processing' | 'completed';

  // Additional booking details
  deliveryAddress?: string;
  rentalDuration: number;
  returnDeadline?: Date;
  paymentMethod: 'cash' | 'online' | 'card' | 'bank_transfer' | 'upi';
  specialInstructions?: string;

  // Notes and comments
  adminNotes?: string;
  customerNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String },
  location: { type: String },
  mobile: { type: String },
  email: { type: String },
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
  }
}, { _id: false });

const bookingItemSchema = new Schema({
  dressId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  priceAfterBargain: { type: Number, required: true },

  // Payment tracking
  bookingAmount: { type: Number, default: 0 }, // Initial booking payment
  advance: { type: Number, default: 0 }, // Additional advance payments
  pending: { type: Number, default: 0 }, // Remaining amount to be paid
  finalPayment: { type: Number, default: 0 }, // Full payment made before delivery
  totalPaid: { type: Number, default: 0 }, // Total amount received

  securityAmount: { type: Number, default: 0 },

  // Additional costs
  additionalCosts: [{
    reason: { type: String },
    amount: { type: Number, default: 0 }
  }],

  // Transport & Delivery
  sendDate: { type: Date },
  deliveryMethod: { type: String, enum: ['parcel', 'bus', 'courier', 'hand_delivery', 'other'] },
  transportCost: { type: Number, default: 0 }, // Cost of transportation
  transportPaidBy: { type: String, enum: ['business', 'customer'], default: 'business' },

  // Usage & Return
  receiveDate: { type: Date },
  dressImage: { type: String },
  useDress: { type: String },
  useDressDate: { type: Date },
  useDressTime: { type: String, enum: ['morning', 'evening'] },

  // Processing & Quality Check
  dryCleaningCost: { type: Number, default: 0 },
  conditionOnReturn: {
    type: String,
    enum: ['excellent', 'very_good', 'good', 'fair', 'damaged', 'lost'],
    default: 'good'
  },
  damageDescription: { type: String },
  repairCost: { type: Number, default: 0 },
  isRepairable: { type: Boolean, default: true },

  // Financial calculations
  totalCost: { type: Number, default: 0 }, // transportCost + dryCleaningCost + repairCost
  profit: { type: Number, default: 0 }, // totalPaid - totalCost
  status: {
    type: String,
    enum: ['booked', 'paid', 'sent', 'delivered', 'in_use', 'returned', 'processing', 'completed', 'damaged', 'lost'],
    default: 'booked'
  },
}, { _id: false });

const bookingSchema = new Schema<IBooking>({
  bookingId: { type: String, default: () => `BKG-${randomUUID()}`, unique: true },
  items: { type: [bookingItemSchema], required: true, default: [] },

  // Legacy fields for backward compatibility
  dressId: { type: Schema.Types.ObjectId, ref: 'Product' },
  priceAfterBargain: { type: Number },
  advance: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  securityAmount: { type: Number, default: 0 },
  sendDate: { type: Date },
  receiveDate: { type: Date },
  dressImage: { type: String },

  // Common fields
  customer: { type: customerSchema, required: true },
  referenceCustomer: { type: String },

  // Workflow status
  status: {
    type: String,
    enum: ['active', 'completed', 'canceled'],
    default: 'active'
  },
  canceledAt: { type: Date },
  cancelReason: { type: String },

  // Financial summaries (auto-calculated)
  totalPrice: { type: Number, default: 0 }, // Sum of all item priceAfterBargain
  totalBookingAmount: { type: Number, default: 0 }, // Sum of all bookingAmount
  totalAdvance: { type: Number, default: 0 }, // Sum of all advance payments
  totalFinalPayment: { type: Number, default: 0 }, // Sum of all finalPayment
  totalPaid: { type: Number, default: 0 }, // Sum of all totalPaid
  totalPending: { type: Number, default: 0 }, // Sum of all pending amounts
  totalSecurity: { type: Number, default: 0 }, // Sum of all securityAmount

  // Cost tracking
  totalTransportCost: { type: Number, default: 0 }, // Sum of all transportCost
  totalDryCleaningCost: { type: Number, default: 0 }, // Sum of all dryCleaningCost
  totalRepairCost: { type: Number, default: 0 }, // Sum of all repairCost
  totalOperationalCost: { type: Number, default: 0 }, // transportCost + dryCleaningCost + repairCost

  // Profit/Loss calculation
  grossProfit: { type: Number, default: 0 }, // totalPaid - totalPrice
  netProfit: { type: Number, default: 0 }, // grossProfit - totalOperationalCost

  // Workflow milestones
  workflowStage: {
    type: String,
    enum: ['booking', 'payment', 'delivery', 'usage', 'return', 'processing', 'completed'],
    default: 'booking'
  },

  // Additional booking details
  deliveryAddress: { type: String },
  rentalDuration: { type: Number, default: 1 },
  returnDeadline: { type: Date },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'card', 'bank_transfer', 'upi'],
    default: 'cash'
  },
  specialInstructions: { type: String },

  // Notes and comments
  adminNotes: { type: String },
  customerNotes: { type: String },
}, {
  timestamps: true
});

// Pre-save hook to calculate totals
bookingSchema.pre('save', function() {
  if (this.items && this.items.length > 0) {
    // Calculate item-level totals
    this.items.forEach(item => {
      // Calculate total paid for each item
      item.totalPaid = (item.bookingAmount || 0) + (item.advance || 0) + (item.finalPayment || 0);

      // Calculate total cost for each item (including additional costs)
      const itemAdditionalCosts = item.additionalCosts?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0;
      item.totalCost = (item.transportCost || 0) + (item.dryCleaningCost || 0) + (item.repairCost || 0) + itemAdditionalCosts;

      // Calculate profit for each item
      item.profit = item.totalPaid - item.totalCost;
    });

    // Calculate booking-level financial summaries
    this.totalPrice = this.items.reduce((sum, item) => sum + (item.priceAfterBargain || 0), 0);
    this.totalBookingAmount = this.items.reduce((sum, item) => sum + (item.bookingAmount || 0), 0);
    this.totalAdvance = this.items.reduce((sum, item) => sum + (item.advance || 0), 0);
    this.totalFinalPayment = this.items.reduce((sum, item) => sum + (item.finalPayment || 0), 0);
    this.totalPaid = this.items.reduce((sum, item) => sum + (item.totalPaid || 0), 0);
    this.totalPending = this.items.reduce((sum, item) => sum + (item.pending || 0), 0);
    this.totalSecurity = this.items.reduce((sum, item) => sum + (item.securityAmount || 0), 0);

    // Calculate operational costs
    this.totalTransportCost = this.items.reduce((sum, item) => sum + (item.transportCost || 0), 0);
    this.totalDryCleaningCost = this.items.reduce((sum, item) => sum + (item.dryCleaningCost || 0), 0);
    this.totalRepairCost = this.items.reduce((sum, item) => sum + (item.repairCost || 0), 0);
    // Calculate total additional costs
    const totalAdditionalCosts = this.items.reduce((sum, item) => {
      return sum + (item.additionalCosts?.reduce((costSum, cost) => costSum + (cost.amount || 0), 0) || 0);
    }, 0);
    this.totalOperationalCost = this.totalTransportCost + this.totalDryCleaningCost + this.totalRepairCost + totalAdditionalCosts;

    // Calculate profits
    this.grossProfit = this.totalPaid - this.totalPrice;
    this.netProfit = this.grossProfit - this.totalOperationalCost;

    // Determine workflow stage based on item statuses
    const itemStatuses = this.items.map(item => item.status);
    if (itemStatuses.every(status => status === 'completed')) {
      this.workflowStage = 'completed';
    } else if (itemStatuses.some(status => status === 'processing')) {
      this.workflowStage = 'processing';
    } else if (itemStatuses.some(status => status === 'returned')) {
      this.workflowStage = 'return';
    } else if (itemStatuses.some(status => status === 'in_use')) {
      this.workflowStage = 'usage';
    } else if (itemStatuses.some(status => status === 'delivered')) {
      this.workflowStage = 'delivery';
    } else if (itemStatuses.some(status => status === 'sent')) {
      this.workflowStage = 'delivery';
    } else if (itemStatuses.some(status => status === 'paid')) {
      this.workflowStage = 'payment';
    } else {
      this.workflowStage = 'booking';
    }

  } else if (this.priceAfterBargain) {
    // Legacy single-item support
    this.totalPrice = this.priceAfterBargain || 0;
    this.totalAdvance = this.advance || 0;
    this.totalPending = this.pending || 0;
    this.totalSecurity = this.securityAmount || 0;

    // For completed bookings, calculate total paid
    if (this.status === 'completed') {
      this.totalPaid = this.totalAdvance;
      this.grossProfit = this.totalPaid - this.totalPrice;
      this.netProfit = this.grossProfit - this.totalOperationalCost;
    }
  }
});

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
