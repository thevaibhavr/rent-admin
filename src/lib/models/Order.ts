import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  rentalDuration: number;
  price: number;
  totalPrice: number;
}

export interface IShippingAddress {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IOrder extends Document {
  user?: Types.ObjectId;
  isGuestOrder: boolean;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: 'Credit Card' | 'Debit Card' | 'PayPal' | 'Cash on Delivery';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Returned' | 'Cancelled';
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  orderNumber?: string;
  rentalStartDate: Date;
  rentalEndDate: Date;
  needDate: Date;
  notes?: string;
  adminNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  calculateTotal(): number;
}

const orderSchema = new Schema<IOrder>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for guest orders
  },
  isGuestOrder: {
    type: Boolean,
    default: false
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    rentalDuration: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Credit Card', 'Debit Card', 'PayPal', 'Cash on Delivery']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Returned', 'Cancelled'],
    default: 'Pending'
  },
  subtotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  rentalStartDate: {
    type: Date,
    required: true
  },
  rentalEndDate: {
    type: Date,
    required: true
  },
  needDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function() {
  if (!this.isNew) return;

  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  this.orderNumber = `ORD${year}${month}${day}${random}`;
});

// Calculate total amount
orderSchema.methods.calculateTotal = function(this: IOrder): number {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.shippingCost + this.tax;
  return this.totalAmount;
};

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order;
