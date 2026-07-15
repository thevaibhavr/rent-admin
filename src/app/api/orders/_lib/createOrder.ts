import { Types } from 'mongoose';
import Product from '@/lib/models/Product';

// Mirrors express-validator's errors.array() entries
export type FieldError = {
  type: 'field';
  value: unknown;
  msg: string;
  path: string;
  location: 'body';
};

export interface CreateOrderBody {
  items?: Array<{ product?: unknown; quantity?: unknown; rentalDuration?: unknown }>;
  shippingAddress?: {
    name?: unknown;
    phone?: unknown;
    street?: unknown;
    city?: unknown;
    state?: unknown;
    zipCode?: unknown;
    country?: unknown;
  };
  paymentMethod?: unknown;
  rentalStartDate?: unknown;
  rentalEndDate?: unknown;
  needDate?: unknown;
  notes?: unknown;
}

const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'PayPal', 'Cash on Delivery'];

function isIntMin(value: unknown, min: number): boolean {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : NaN;
  return Number.isInteger(n) && n >= min;
}

function notEmpty(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function isISO8601(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}([T ].+)?$/.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  );
}

// Port of the express-validator chain on POST /api/orders and POST /api/orders/guest
export function validateCreateOrderBody(body: CreateOrderBody): FieldError[] {
  const errors: FieldError[] = [];
  const push = (value: unknown, msg: string, path: string) =>
    errors.push({ type: 'field', value, msg, path, location: 'body' });

  const items = body.items;
  if (!Array.isArray(items) || items.length < 1) {
    push(items, 'At least one item is required', 'items');
  }
  if (Array.isArray(items)) {
    items.forEach((item, i) => {
      if (typeof item?.product !== 'string' || !MONGO_ID_REGEX.test(item.product)) {
        push(item?.product, 'Valid product ID is required', `items[${i}].product`);
      }
      if (!isIntMin(item?.quantity, 1)) {
        push(item?.quantity, 'Quantity must be at least 1', `items[${i}].quantity`);
      }
      if (!isIntMin(item?.rentalDuration, 1)) {
        push(item?.rentalDuration, 'Rental duration must be at least 1 day', `items[${i}].rentalDuration`);
      }
    });
  }

  const addr = body.shippingAddress;
  if (!notEmpty(addr?.name)) push(addr?.name, 'Shipping name is required', 'shippingAddress.name');
  if (!notEmpty(addr?.phone)) push(addr?.phone, 'Shipping phone is required', 'shippingAddress.phone');
  if (!notEmpty(addr?.street)) push(addr?.street, 'Shipping street is required', 'shippingAddress.street');
  if (!notEmpty(addr?.city)) push(addr?.city, 'Shipping city is required', 'shippingAddress.city');
  if (!notEmpty(addr?.state)) push(addr?.state, 'Shipping state is required', 'shippingAddress.state');
  if (!notEmpty(addr?.zipCode)) push(addr?.zipCode, 'Shipping zip code is required', 'shippingAddress.zipCode');
  if (!notEmpty(addr?.country)) push(addr?.country, 'Shipping country is required', 'shippingAddress.country');

  if (typeof body.paymentMethod !== 'string' || !PAYMENT_METHODS.includes(body.paymentMethod)) {
    push(body.paymentMethod, 'Valid payment method is required', 'paymentMethod');
  }
  if (!isISO8601(body.rentalStartDate)) {
    push(body.rentalStartDate, 'Valid rental start date is required', 'rentalStartDate');
  }
  if (!isISO8601(body.rentalEndDate)) {
    push(body.rentalEndDate, 'Valid rental end date is required', 'rentalEndDate');
  }
  if (!isISO8601(body.needDate)) {
    push(body.needDate, 'Valid need date is required', 'needDate');
  }

  return errors;
}

export interface ComputedOrderItem {
  product: Types.ObjectId;
  quantity: number;
  rentalDuration: number;
  price: number;
  totalPrice: number;
}

export type OrderComputation =
  | { failure: { message: string; status: number; errors?: FieldError[] } }
  | {
      failure?: undefined;
      data: {
        orderItems: ComputedOrderItem[];
        shippingAddress: CreateOrderBody['shippingAddress'];
        paymentMethod: unknown;
        startDate: Date;
        endDate: Date;
        needDateObj: Date;
        subtotal: number;
        shippingCost: number;
        tax: number;
        totalAmount: number;
        notes: unknown;
      };
    };

// Shared validation + item/total computation for POST / and POST /guest.
// Assumes connectDB() has already been awaited.
export async function computeOrder(body: CreateOrderBody): Promise<OrderComputation> {
  const errors = validateCreateOrderBody(body);
  if (errors.length > 0) {
    return { failure: { message: 'Validation errors', status: 400, errors } };
  }

  const { items, shippingAddress, paymentMethod, rentalStartDate, rentalEndDate, needDate } = body;
  const notes = typeof body.notes === 'string' ? body.notes.trim() : body.notes;

  // Validate rental dates
  const startDate = new Date(rentalStartDate as string);
  const endDate = new Date(rentalEndDate as string);
  const needDateObj = new Date(needDate as string);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return { failure: { message: 'Rental start date cannot be in the past', status: 400 } };
  }
  if (endDate <= startDate) {
    return { failure: { message: 'Rental end date must be after start date', status: 400 } };
  }
  if (needDateObj < today) {
    return { failure: { message: 'Need date cannot be in the past', status: 400 } };
  }

  // Validate and calculate order items
  const orderItems: ComputedOrderItem[] = [];
  let subtotal = 0;

  for (const item of items as Array<{ product: string; quantity: unknown; rentalDuration: unknown }>) {
    const product = await Product.findById(item.product);
    if (!product) {
      return { failure: { message: `Product with ID ${item.product} not found`, status: 400 } };
    }
    if (!product.isAvailable) {
      return { failure: { message: `Product ${product.name} is not available`, status: 400 } };
    }

    // Always use 1 day rental duration
    // (price is required in the schema; the interface marks it optional)
    const price = product.price as number;
    const itemTotal = price * Number(item.quantity) * 1;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id as Types.ObjectId,
      quantity: Number(item.quantity),
      rentalDuration: 1, // Always 1 day
      price,
      totalPrice: itemTotal,
    });
  }

  // Calculate shipping and tax
  const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax
  const totalAmount = subtotal + shippingCost + tax;

  return {
    data: {
      orderItems,
      shippingAddress,
      paymentMethod,
      startDate,
      endDate,
      needDateObj,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      notes,
    },
  };
}
