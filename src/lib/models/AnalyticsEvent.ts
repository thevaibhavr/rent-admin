import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  eventId: string;
  type: 'product_view' | 'product_click' | 'category_click' | 'search';
  visitorId: string;
  productId?: string;
  productName?: string;
  categorySlug?: string;
  categoryName?: string;
  keyword?: string;
  resultCount?: number;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  visitorId: { type: String, required: true },
  productId: String,
  productName: String,
  categorySlug: String,
  categoryName: String,
  keyword: String,
  resultCount: Number,
  createdAt: { type: Date, required: true },
}, {
  versionKey: false,
  collection: 'analytics_events',
});

analyticsEventSchema.index({ type: 1, createdAt: -1 });
analyticsEventSchema.index({ type: 1, productId: 1, createdAt: -1 });
analyticsEventSchema.index({ type: 1, categorySlug: 1, createdAt: -1 });
analyticsEventSchema.index({ type: 1, keyword: 1, createdAt: -1 });
analyticsEventSchema.index({ visitorId: 1, type: 1, createdAt: -1 });

const AnalyticsEvent: Model<IAnalyticsEvent> =
  mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;
