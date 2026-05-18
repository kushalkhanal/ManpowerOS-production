import mongoose from "mongoose";
import { formatBSDisplay } from "../utils/bsDate.js";

const sponsorSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    fullNameNepali: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    alternatePhone: {
      type: String,
    },
    email: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
    },

    coverageProvinces: [
      {
        type: String,
      },
    ],
    coverageDistricts: [
      {
        type: String,
      },
    ],
    coverageMunicipalities: [
      {
        type: String,
      },
    ],
    primaryArea: {
      type: String,
    },

    citizenshipNumber: {
      type: String,
    },
    citizenshipIssuedDistrict: {
      type: String,
    },
    citizenshipIssuedDate: {
      type: Date,
    },
    nationalIdNumber: {
      type: String,
    },

    permanentProvince: {
      type: String,
    },
    permanentDistrict: {
      type: String,
    },
    permanentMunicipality: {
      type: String,
    },
    permanentWardNo: {
      type: String,
    },
    currentAddress: {
      type: String,
    },

    bankName: {
      type: String,
    },
    bankBranch: {
      type: String,
    },
    bankAccountNumber: {
      type: String,
    },
    bankAccountName: {
      type: String,
    },

    introducedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    relationshipStartDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },

    role: {
      type: String,
      enum: ["agent", "senior_agent", "partner", "coordinator", "manager"],
      default: "agent",
    },
    overseasCompany: {
      type: String,
    },
    sponsorNumber: {
      type: String,
    },
    sponsorContactNumber: {
      type: String,
    },
    permissions: [
      {
        type: String,
        enum: [
          "canReferCandidates",
          "canViewOwnCandidates",
          "canEditOwnCandidates",
          "canDeleteOwnCandidates",
          "canViewAllCandidates",
          "canExportCandidates",
        ],
      },
    ],
    portalAccess: {
      type: Boolean,
      default: false,
    },
    portalInvitedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deactivatedAt: {
      type: Date,
    },
    deactivatedReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

sponsorSchema.index({ agencyId: 1, phone: 1 }, { unique: true });
sponsorSchema.index({ agencyId: 1, isActive: 1 });
sponsorSchema.index({ agencyId: 1, coverageDistricts: 1 });

sponsorSchema.virtual("candidatesReferred", {
  ref: "Candidate",
  localField: "_id",
  foreignField: "sponsorId",
  count: true,
});

sponsorSchema.virtual("candidatesDeparted", {
  ref: "Candidate",
  localField: "_id",
  foreignField: "sponsorId",
  match: { status: "departed" },
  count: true,
});

sponsorSchema.virtual("referredCandidates", {
  ref: "Candidate",
  localField: "_id",
  foreignField: "sponsorId",
  options: { sort: { registeredAt: -1 } },
});

sponsorSchema.set("toJSON", { virtuals: true });
sponsorSchema.set("toObject", { virtuals: true });

export default mongoose.model("Sponsor", sponsorSchema);
