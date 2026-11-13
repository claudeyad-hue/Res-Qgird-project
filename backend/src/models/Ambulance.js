import mongoose from 'mongoose';

export const AMBULANCE_CATEGORIES = ['government-108', 'government-102', 'als', 'bls', 'private', 'hospital-based'];
export const AMBULANCE_VERIFICATION = ['official-source', 'provider-confirmed', 'directory-listed', 'unverified'];

const ambulanceSchema = new mongoose.Schema({
  recordCode: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
  identityKey: { type: String, unique: true, trim: true, maxlength: 400 },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  providerName: { type: String, required: true, trim: true, maxlength: 180 },
  ownership: { type: String, enum: ['government', 'private', 'unknown'], default: 'unknown', index: true },
  category: { type: String, required: true, enum: AMBULANCE_CATEGORIES, index: true },
  serviceType: { type: String, required: true, trim: true, maxlength: 100 },
  contactNumber: { type: String, default: null, trim: true, maxlength: 40 },
  alternateContact: { type: String, default: null, trim: true, maxlength: 40 },
  address: { type: String, default: null, trim: true, maxlength: 300 },
  city: { type: String, default: 'Ghaziabad', trim: true, maxlength: 100 },
  district: { type: String, default: 'Ghaziabad', trim: true, maxlength: 100 },
  state: { type: String, default: 'Uttar Pradesh', trim: true, maxlength: 100 },
  location: { type: { type: String, enum: ['Point'], default: undefined }, coordinates: { type: [Number], default: undefined } },
  vehicleType: { type: String, default: null, trim: true, maxlength: 100 },
  facilities: { type: [String], default: [] },
  operatingHours: { type: String, default: null, trim: true, maxlength: 120 },
  availabilityStatus: { type: String, enum: ['unknown', 'available', 'unavailable'], default: 'unknown' },
  verificationStatus: { type: String, enum: AMBULANCE_VERIFICATION, default: 'unverified', index: true },
  sourceUrl: { type: String, required: true, trim: true, maxlength: 1000 },
  sourcePublishedAt: { type: Date, default: null },
  lastVerifiedAt: { type: Date, default: null },
  scope: { type: String, enum: ['provider-location', 'district-service'], default: 'provider-location' },
  publishedFleetCount: { type: Number, default: null, min: 0 },
}, { timestamps: true, toJSON: { virtuals: true, transform: (doc, ret) => { ret.id = ret.recordCode || doc._id.toString(); delete ret.__v; return ret; } } });

ambulanceSchema.pre('validate', function validateAmbulance(next) {
  if (this.name && this.providerName) this.identityKey = `${this.providerName.trim().toLowerCase()}|${this.name.trim().toLowerCase()}`;
  if (this.location && (this.location.type !== 'Point' || !Array.isArray(this.location.coordinates) || this.location.coordinates.length !== 2)) {
    this.invalidate('location', 'Location must be a GeoJSON Point with [longitude, latitude] coordinates.');
  }
  if (this.location?.coordinates) {
    const [longitude, latitude] = this.location.coordinates;
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) this.invalidate('location', 'Location coordinates are out of range.');
  }
  if (this.scope === 'district-service' && this.location) this.invalidate('location', 'District services cannot be mapped as individual provider or vehicle locations.');
  next();
});

ambulanceSchema.index({ location: '2dsphere' });
ambulanceSchema.index({ category: 1, serviceType: 1 });
ambulanceSchema.index({ district: 1, city: 1 });

export const Ambulance = mongoose.models.Ambulance || mongoose.model('Ambulance', ambulanceSchema);
export default Ambulance;
