import mongoose from 'mongoose';

const TEAM_AVAILABILITIES = ['available', 'assigned', 'deployed', 'standby', 'off-duty'];

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
    },
    role: {
      type: String,
      trim: true,
      default: 'Field Specialist',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    teamCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: [true, 'Team type is required'],
      trim: true,
    },
    members: {
      type: [teamMemberSchema],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
      default: null,
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
      default: null,
    },
    availability: {
      type: String,
      required: [true, 'Availability is required'],
      enum: {
        values: TEAM_AVAILABILITIES,
        message: 'Availability must be one of: available, assigned, deployed, standby, off-duty',
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
    contact: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = doc.teamCode || doc._id.toString();
        ret.teamId = doc.teamCode || doc._id.toString();
        ret.status = doc.availability;
        ret.currentIncidentId = doc.assignedIncident ? doc.assignedIncident.toString() : null;
        delete ret.__v;
        return ret;
      },
    },
  }
);

teamSchema.pre('validate', function (next) {
  if (typeof this.availability === 'string') {
    this.availability = this.availability.toLowerCase().trim();
  }
  if (!this.teamCode && this.isNew) {
    const randomSuffix = Math.floor(1 + Math.random() * 99);
    this.teamCode = `TEAM-${randomSuffix < 10 ? '0' + randomSuffix : randomSuffix}`;
  }
  next();
});

teamSchema.index({ availability: 1 });
teamSchema.index({ type: 1 });

export const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);
export default Team;
