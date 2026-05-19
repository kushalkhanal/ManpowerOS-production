import mongoose from "mongoose";
import { formatBSDisplay } from "../utils/bsDate.js";
import { NEPAL_DISTRICTS } from "../constants/nepalDistricts.js";

const passportSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      default: null,
    },
    passportNumber: {
      type: String,
      required: true,
    },
    guardianNumber: String,
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    issueDate: Date,
    expiryDate: Date,
    issuedDistrict: { type: String, enum: [...NEPAL_DISTRICTS, null] },
    scannedImageUrl: String,
    custodyStatus: {
      type: String,
      enum: [
        "with_agency",
        "returned_to_candidate",
        "submitted_embassy",
        "lost",
      ],
      default: "with_agency",
    },
    location: String,
    notes: String,
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    collectedAt: {
      type: Date,
      default: Date.now,
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    returnedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    allocationStatus: {
      type: String,
      enum: ["in_pool", "allocated", "departed", "returned"],
      default: "in_pool",
    },
    allocatedToDemandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDemand",
    },
    allocatedAt: Date,
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    age: Number,
    districtOfOrigin: { type: String, enum: [...NEPAL_DISTRICTS, null] },
    contactPhone: String,
    contactAddress: String,
    desiredCountry: String,
    agentName: String,
    agentNumber: String,
    sponsorName: String,
    sponsorNumber: String,
    assignedStaff: String,
    serviceFeeAgreed: Number,
    // ── Soft delete ────────────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically exclude soft-deleted records from all find* queries.
// Aggregate pipelines are NOT covered — add { isDeleted: { $ne: true } } explicitly there.
passportSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

passportSchema.index({ agencyId: 1, passportNumber: 1 }, { unique: true });
passportSchema.index({ agencyId: 1, candidateId: 1 });
passportSchema.index({ agencyId: 1, custodyStatus: 1 });
passportSchema.index({ agencyId: 1, allocationStatus: 1 });
passportSchema.index({ agencyId: 1, age: 1 });
passportSchema.index({ agencyId: 1, districtOfOrigin: 1 });
passportSchema.index({ agencyId: 1, allocationStatus: 1, expiryDate: 1 }); // For pool filtering
passportSchema.index({ agencyId: 1, allocationStatus: 1, gender: 1, age: 1 }); // For demand matching
passportSchema.index({ agencyId: 1, expiryDate: 1 }); // For expiry tracking

passportSchema.pre("save", function (next) {
  if (this.dateOfBirth) {
    const today = new Date();
    this.age = Math.floor((today - this.dateOfBirth) / 31557600000);
  }
  if (this.issuedDistrict && !this.districtOfOrigin) {
    this.districtOfOrigin = this.issuedDistrict;
  }
  next();
});

passportSchema.virtual("expiryDateBS").get(function () {
  return this.expiryDate ? formatBSDisplay(this.expiryDate) : null;
});

passportSchema.virtual("dateOfBirthBS").get(function () {
  return this.dateOfBirth ? formatBSDisplay(this.dateOfBirth) : null;
});

passportSchema.virtual("issueDateBS").get(function () {
  return this.issueDate ? formatBSDisplay(this.issueDate) : null;
});

passportSchema.virtual("collectedAtBS").get(function () {
  return this.collectedAt ? formatBSDisplay(this.collectedAt) : null;
});

passportSchema.virtual("daysInPool").get(function () {
  if (!this.collectedAt) return 0;
  const now = new Date();
  return Math.floor((now - this.collectedAt) / (1000 * 60 * 60 * 24));
});

passportSchema.virtual("validityMonths").get(function () {
  if (!this.expiryDate) return 0;
  const now = new Date();
  const months =
    (this.expiryDate.getFullYear() - now.getFullYear()) * 12 +
    (this.expiryDate.getMonth() - now.getMonth());
  return Math.max(0, months);
});

passportSchema.set("toJSON", { virtuals: true });
passportSchema.set("toObject", { virtuals: true });

export default mongoose.model("Passport", passportSchema);
