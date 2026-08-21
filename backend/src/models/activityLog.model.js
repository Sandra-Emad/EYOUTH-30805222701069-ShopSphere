import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      default: null,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    entity: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    entityId: {
      type: String,
      default: null,
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    method: {
      type: String,
      default: null,
    },

    endpoint: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({
  createdAt: -1,
});

activityLogSchema.index({
  userId: 1,
  createdAt: -1,
});

activityLogSchema.index({
  action: 1,
  createdAt: -1,
});

activityLogSchema.index({
  entity: 1,
  createdAt: -1,
});

const ActivityLog = mongoose.model(
  "ActivityLog",
  activityLogSchema
);

export default ActivityLog;