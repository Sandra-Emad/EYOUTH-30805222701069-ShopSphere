import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: Number, default: null, index: true },
    action: { type: String, required: true, trim: true, index: true },
    entity: { type: String, required: true, trim: true, index: true },
    entityId: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    method: { type: String, default: null },
    endpoint: { type: String, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", activityLogSchema);

let connected = false;

async function connectDatabase() {
  if (connected) return;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(uri);
  connected = true;
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    await connectDatabase();

    const days = Math.max(
      1,
      Number(req.query?.days || 30)
    );

    const cutoff = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    );

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: cutoff },
    });

    return res.status(200).json({
      success: true,
      service: "shopsphere-serverless",
      job: "activity-log-cleanup",
      deletedCount: result.deletedCount,
      olderThanDays: days,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Activity log cleanup failed:", error);

    return res.status(500).json({
      success: false,
      message: "Activity log cleanup failed",
    });
  }
}
