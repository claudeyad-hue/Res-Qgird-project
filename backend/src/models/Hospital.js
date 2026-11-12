import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  beds: { type: Number, default: null, min: 0 },
  icuBeds: { type: Number, default: null, min: 0 },
  oxygen: { type: Number, default: null, min: 0 },
  ambulances: { type: Number, default: null, min: 0 },
  emergencyStatus: { type: String, default: null, enum: [null, 'accepting', 'limited', 'full', 'diverting'] },
  updatedAt: { type: Date, default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  source: { type: String, default: null, trim: true, maxlength: 300 },
}, { _id: false });

const hospitalSchema = new mongoose.Schema({
  hospitalCode: { type: String, unique: true, sparse: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  category: { type: String, default: 'Hospital', trim: true, maxlength: 100 },
  ownership: { type: String, enum: ['government', 'private', 'not-published'], default: 'not-published' },
  location: { type: String, default: null, trim: true },
  address: { type: String, default: null, trim: true },
  latitude: { type: Number, default: null, min: -90, max: 90 },
  longitude: { type: Number, default: null, min: -180, max: 180 },
  contact: { type: String, default: null, trim: true },
  specialties: { type: [String], default: [] },
  emergencyServiceListed: { type: Boolean, default: null },
  totalBeds: { type: Number, default: null, min: 0 },
  availableBeds: { type: Number, default: null, min: 0 },
  totalICUBeds: { type: Number, default: null, min: 0 },
  availableICUBeds: { type: Number, default: null, min: 0 },
  ambulances: { type: Number, default: null, min: 0 },
  emergencyStatus: { type: String, enum: ['unknown', 'active', 'accepting', 'limited', 'full', 'diverting'], default: 'unknown' },
  liveAvailability: { type: availabilitySchema, default: () => ({}) },
  availabilitySource: { type: String, default: null },
  sourceUrls: { type: [String], default: [] },
  sourceUrl: { type: String, default: null },
  locationSourceUrl: { type: String, default: null },
  verificationStatus: { type: String, default: 'unverified' },
  sourceCheckedAt: { type: Date, default: null },
  lastVerifiedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = doc.hospitalCode || doc._id.toString();
      ret.bedsTotal = ret.totalBeds ?? null;
      ret.bedsAvail = ret.availableBeds ?? null;
      ret.icuTotal = ret.totalICUBeds ?? null;
      ret.icuAvail = ret.availableICUBeds ?? null;
      ret.status = ret.emergencyStatus || 'unknown';
      ret.address = ret.address || ret.location || null;
      ret.sources = ret.sourceUrls || [];
      ret.availabilityLabel = ret.liveAvailability?.updatedAt ? null : 'Live availability not connected';
      delete ret.__v;
      return ret;
    },
  },
});

hospitalSchema.pre('validate', function normalizeHospital(next) {
  if (!this.hospitalCode && this.isNew) this.hospitalCode = `GZB-${new mongoose.Types.ObjectId().toString()}`;
  if (!this.address && this.location) this.address = this.location;
  if (!this.location && this.address) this.location = this.address;
  next();
});

hospitalSchema.index({ emergencyStatus: 1 });
hospitalSchema.index({ location: 1 });
hospitalSchema.index({ category: 1, ownership: 1 });

export const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
export default Hospital;
