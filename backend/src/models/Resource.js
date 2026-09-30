import mongoose from 'mongoose';

const RESOURCE_STATUSES = ['available', 'low', 'depleted', 'in-transit', 'allocated'];

const resourceSchema = new mongoose.Schema(
  {
    resourceCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
      validate: {
        validator: function (val) {
          return val <= this.quantity;
        },
        message: 'Available quantity cannot exceed total quantity',
      },
    },
    unit: {
      type: String,
      trim: true,
      default: 'units',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: RESOURCE_STATUSES,
        message: 'Status must be one of: available, low, depleted, in-transit, allocated',
      },
      lowercase: true,
      trim: true,
      default: 'available',
    },
    assignedIncident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = doc.resourceCode || doc._id.toString();
        ret.amount = doc.availableQuantity;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-adjust status based on availableQuantity
resourceSchema.pre('validate', function (next) {
  if (typeof this.status === 'string') {
    this.status = this.status.toLowerCase().trim();
  }
  if (!this.resourceCode && this.isNew) {
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    this.resourceCode = `RES-${randomSuffix}`;
  }
  if (this.availableQuantity === 0 && this.status !== 'in-transit') {
    this.status = 'depleted';
  } else if (this.quantity > 0 && this.availableQuantity < this.quantity * 0.25 && this.status === 'available') {
    this.status = 'low';
  }
  next();
});

resourceSchema.index({ type: 1, status: 1 });
resourceSchema.index({ location: 1 });

export const Resource = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);
export default Resource;
