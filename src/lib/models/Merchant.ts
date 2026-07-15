import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMerchant extends Document {
  name: string;
  mobilenumber?: number;
  address?: string;
}

const merchantSchema = new Schema<IMerchant>({
  name: {
    type: String,
    required: true
  },
  mobilenumber: {
    type: Number
  },
  address: {
    type: String
  }
});

const Merchant: Model<IMerchant> = mongoose.models.Merchant || mongoose.model<IMerchant>('Merchant', merchantSchema);

export default Merchant;
