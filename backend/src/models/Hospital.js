import mongoose from 'mongoose';

const HOSPITAL_STATUSES = ['active', 'accepting', 'limited', 'full', 'diverting'];

const hospitalSchema = new mongoose.Schema(
  {
    hospitalCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    contact: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    totalBeds: {
      type: Number,
      required: [true, 'Total beds is required'],
      min: [0, 'Total beds must be 0 or greater'],
    },
    availableBeds: {
      type: Number,
      required: [true, 'Available beds is required'],
      min: [0, 'Available beds must be 0 or greater'],
      validate: {
        validator: function (val) {
          return val <= this.totalBeds;
        },
        message: 'Available beds cannot exceed total beds',
      },
    },
    totalICUBeds: {
      type: Number,
      required: [true, 'Total ICU beds is required'],
      min: [0, 'Total ICU beds must be 0 or greater'],
    },
    availableICUBeds: {
      type: Number,
      required: [true, 'Available ICU beds is required'],
      min: [0, 'Available ICU beds must be 0 or greater'],
      validate: {
        validator: function (val) {
          return val <= this.totalICUBeds;
        },
        message: 'Available ICU beds cannot exceed total ICU beds',
      },
    },
    emergencyStatus: {
      type: String,
      required: [true, 'Emergency status is required'],
      enum: {
        values: HOSPITAL_STATUSES,
        message: 'Emergency status must be one of: active, accepting, limited, full, diverting',
      },
      lowercase: true,
      trim: true,
      default: 'active',
    },
    ambulances: {
      type: Number,
      default: 0,
      min: [0, 'Ambulance count cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = doc.hospitalCode || doc._id.toString();
        // Frontend compatibility aliases
        ret.bedsTotal = doc.totalBeds;
        ret.bedsAvail = doc.availableBeds;
        ret.icuTotal = doc.totalICUBeds;
        ret.icuAvail = doc.availableICUBeds;
        ret.status = doc.emergencyStatus;
        delete ret.__v;
        return ret;
      },
    },
  }
);

hospitalSchema.pre('validate', function (next) {
  if (typeof this.emergencyStatus === 'string') {
    this.emergencyStatus = this.emergencyStatus.toLowerCase().trim();
  }
  if (!this.hospitalCode && this.isNew) {
    const randomSuffix = Math.floor(1 + Math.random() * 99);
    this.hospitalCode = `HOSP-${randomSuffix < 10 ? '0' + randomSuffix : randomSuffix}`;
  }
  next();
});

hospitalSchema.index({ emergencyStatus: 1 });
hospitalSchema.index({ location: 1 });

export const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
export default Hospital;
