import mongoose from 'mongoose';

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['reported', 'verified', 'active', 'contained', 'resolved'];

const incidentSchema = new mongoose.Schema(
  {
    incidentCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Incident type is required'],
      trim: true,
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: SEVERITIES,
        message: 'Severity must be one of: low, medium, high, critical',
      },
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: STATUSES,
        message: 'Status must be one of: reported, verified, active, contained, resolved',
      },
      lowercase: true,
      trim: true,
      default: 'reported',
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
    reportedBy: {
      type: String,
      trim: true,
      default: 'Public / Field Report',
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    assignedTeamName: {
      type: String,
      trim: true,
      default: null,
    },
    affectedPeople: {
      type: Number,
      default: 0,
      min: [0, 'Affected people count cannot be negative'],
    },
    priority: {
      type: Number,
      default: 3,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Expose both id and _id for maximum frontend compatibility
        ret.id = doc.incidentCode || doc._id.toString();
        // Provide frontend compatibility aliases
        ret.address = ret.location;
        ret.desc = ret.description;
        ret.affected = ret.affectedPeople;
        ret.team = ret.assignedTeamName;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-generate incidentCode before validation if not present
incidentSchema.pre('validate', function (next) {
  // Normalize casing for severity and status
  if (this.severity && typeof this.severity === 'string') {
    this.severity = this.severity.toLowerCase().trim();
  }
  if (this.status && typeof this.status === 'string') {
    const s = this.status.toLowerCase().trim();
    // Map any legacy status aliases if needed
    if (s === 'in progress' || s === 'in-progress' || s === 'assigned' || s === 'rescue dispatched') {
      this.status = 'active';
    } else {
      this.status = s;
    }
  }

  if (!this.incidentCode && this.isNew) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.incidentCode = `INC-${randomSuffix}`;
  }
  next();
});

// Indexes for high performance querying, filtering, and searching
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ type: 1 });
incidentSchema.index({ createdAt: -1 });

export const Incident = mongoose.models.Incident || mongoose.model('Incident', incidentSchema);
export default Incident;
