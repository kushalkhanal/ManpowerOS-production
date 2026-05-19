import mongoose from "mongoose";

const manualAlertSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    message: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ["critical", "warning", "info"],
      default: "info",
    },
    targetRoles: [{ type: String }],
    targetUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String },
    actionUrl: { type: String, default: "/alerts" },
  },
  { timestamps: true },
);

manualAlertSchema.index({ agencyId: 1, createdAt: -1 });

export default mongoose.model("ManualAlert", manualAlertSchema);
