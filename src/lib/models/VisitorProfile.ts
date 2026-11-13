import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IVisitorProfile extends Document {
  visitorId: string;
  name: string;
  mobile: string;
  city: string;
  createdAt: Date;
  updatedAt: Date;
}

const visitorProfileSchema = new Schema<IVisitorProfile>({
  visitorId: { type: String, required: true, unique: true, maxlength: 100 },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  mobile: { type: String, required: true, trim: true, maxlength: 16 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
}, {
  timestamps: true,
  collection: 'visitor_profiles',
});

const VisitorProfile: Model<IVisitorProfile> =
  mongoose.models.VisitorProfile || mongoose.model<IVisitorProfile>('VisitorProfile', visitorProfileSchema);

export default VisitorProfile;
