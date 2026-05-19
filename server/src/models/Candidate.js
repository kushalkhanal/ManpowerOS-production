import mongoose from "mongoose";
import { adToBS, formatBSDisplay } from "../utils/bsDate.js";
import { CANDIDATE_STATUSES } from "../constants/workflow.js";
import { NEPAL_DISTRICTS } from "../constants/nepalDistricts.js";

const DESIRED_COUNTRIES = [
  "Qatar",
  "Saudi Arabia",
  "UAE",
  "Kuwait",
  "Malaysia",
  "Bahrain",
  "Oman",
  "South Korea",
  "Japan",
  "Israel",
  "Poland",
  "Romania",
  "Croatia",
  "Other",
];

const EDUCATION_LEVELS = [
  "illiterate",
  "primary",
  "slc",
  "plus2",
  "bachelor",
  "master",
];

const STATUS_VALUES = CANDIDATE_STATUSES;

const PREDEFINED_SKILLS = [
  "General Labor",
  "Construction",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Masonry",
  "Painting",
  "Welding",
  "Mechanical",
  "Automotive",
  "Housekeeping",
  "Cook",
  "Chef",
  "Waiter",
  "Bartender",
  "Security Guard",
  "Driver",
  "Helper",
  "Machine Operator",
  "Tailoring",
  "Textile",
  "Agriculture",
  "Livestock",
  "Fishery",
];

const NEPAL_PROVINCES = [
  "Province 1",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

// ─── Sub-document schemas ─────────────────────────────────────────────────────
// Defining these explicitly (instead of inline nested paths) makes Mongoose
// reliably persist + return them via $set updates and populate projections.

// NOTE: physicalAttributes and workHistory are declared as INLINE subdocuments
// (see further down in the schema), NOT as separate typed Schemas. The typed-
// Schema approach (`{ type: PhysicalAttributesSchema, default: () => ({}) }`)
// fails silently on `$set` when the existing MongoDB document predates the
// field — Mongoose's strict-mode subdoc cast drops the write. Inline objects
// behave like `nomineeInfo` and persist reliably.


const candidateSchema = new mongoose.Schema(
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
    fullNameNepali: String,
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    nationalIdNumber: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    alternatePhone: String,
    email: String,
    permanentProvince: {
      type: String,
      enum: NEPAL_PROVINCES,
    },
    permanentDistrict: {
      type: String,
      enum: NEPAL_DISTRICTS,
    },
    permanentMunicipality: String,
    permanentWardNo: String,
    temporaryAddress: String,
    temporaryMunicipality: String,
    temporaryDistrict: String,
    temporaryProvince: String,
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
    },
    religion: String,
    // ── Bank Info ──────────────────────────────────────────────────────────────
    bankInfo: {
      bankName: String,
      accountNo: String,
      accountHolderName: String,
      relation: String,
    },
    // ── Training ───────────────────────────────────────────────────────────────
    training: [
      {
        name: String,
        institute: String,
      },
    ],
    // ── Academic ───────────────────────────────────────────────────────────────
    academic: [
      {
        qualification: String,
        institutionName: String,
        institutionAddress: String,
      },
    ],
    // ── Nominee ────────────────────────────────────────────────────────────────
    nomineeInfo: {
      fatherName: String,
      motherName: String,
      spouseName: String,
      noOfChildren: { type: Number, default: 0 },
      spouseAge: { type: Number, default: 0 },
      emergencyContactPerson: String,
      emergencyContactNumber: String,
      emergencyContactAddress: String,
      nomineeName: String,
      nomineeRelation: String,
      nomineeAddress: String,
    },
    // ── Work Detail extras ─────────────────────────────────────────────────────
    visaIssuedDate: Date,
    kdnBpaNo: String,
    branchInfo: String,
    education: {
      type: String,
      enum: EDUCATION_LEVELS,
    },
    skills: [
      {
        type: String,
        enum: PREDEFINED_SKILLS,
      },
    ],
    languagesKnown: [String],
    workExperienceYears: {
      type: Number,
      min: 0,
      max: 50,
    },
    // ── Physical attributes (optional, for labour CV) ──────────────────────────
    physicalAttributes: {
      height: String,
      weight: String,
      bloodGroup: String,
      eyeColor: String,
      complexion: String,
    },
    // ── Past work history (for CV) ─────────────────────────────────────────────
    workHistory: [
      {
        company: String,
        position: String,
        country: String,
        fromDate: Date,
        toDate: Date,
        isCurrent: { type: Boolean, default: false },
      },
    ],
    previousCountry: String,
    desiredCountry: {
      type: String,
      enum: DESIRED_COUNTRIES,
    },
    desiredJobCategory: String,
    referredBy: String,
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    passportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passport",
    },
    passportNumber: String,
    demandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDemand",
    },
    agentName: String,
    agentNumber: String,
    address: String,
    cancellationReason: String,
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
      index: true,
    },
    sponsorName: String,
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: "registered",
    },
    serviceFeeAgreed: {
      type: Number,
      min: 0,
    },
    serviceFeeReceived: {
      type: Number,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },
    // ── FEIMS / DoFE fields ────────────────────────────────────────────────────
    // Purba Swukriti is handled on the DoFE portal. We just record whether
    // it's been obtained for this candidate — single boolean, no workflow.
    purbaSwukritiDone: {
      type: Boolean,
      default: false,
    },
    feimsRegistrationNumber: {
      type: String,
      trim: true,
    },
    feimsApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    dofeFileNumber: {
      type: String,
      trim: true,
    },
    shramIssuedDate: Date,
    shramExpiryDate: Date,
    // ── Visa / departure fields ────────────────────────────────────────────────
    visaNumber: String,
    visaReceivedDate: Date,
    visaExpiryDate: Date,
    visaFileUrl: String,
    shramSwikritiNumber: String,
    eStickerNumber: String,
    feimsSubmittedAt: Date,
    feimsFileUrl: String,
    // ── Malaysia-specific fields (v1) ──────────────────────────────────────────
    // VLN / VDR — Malaysia's calling letter equivalent, issued via FWCMS
    vlnNumber: { type: String, trim: true },
    vlnReceivedDate: Date,
    vlnExpiryDate: Date,
    vlnFileUrl: String,
    // PLKS — Pas Lawatan Kerja Sementara (Malaysia work pass / e-sticker)
    plksNumber: { type: String, trim: true },
    plksIssuedDate: Date,
    plksExpiryDate: Date,
    plksFileUrl: String,
    // FWCMS calling letter (Malaysia government foreign worker system)
    fwcmsCallingLetterNumber: { type: String, trim: true },
    fwcmsReceivedDate: Date,
    // FOMEMA / Bestinet — Malaysia medical screening references
    fomemaReferenceNumber: { type: String, trim: true },
    bestinetBiometricRef: { type: String, trim: true },
    flightDate: Date,
    flightNumber: String,
    airline: String,
    airportReportingTime: String,
    departureFileUrl: String,
    departureStatus: {
      type: String,
      enum: ["pending", "scheduled", "completed"],
      default: "pending",
    },
    documentChecklist: {
      type: Map,
      of: Boolean,
      default: {},
    },
    stageNotes: {
      type: Map,
      of: String,
      default: {},
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    departedAt: Date,
  },
  {
    timestamps: true,
  },
);

candidateSchema.index({ passportId: 1 }, { unique: true, sparse: true });
candidateSchema.index({ agencyId: 1, createdAt: -1 });
candidateSchema.index({ agencyId: 1, status: 1 });
candidateSchema.index({ agencyId: 1, desiredCountry: 1 });
candidateSchema.index({ agencyId: 1, agentId: 1 });
candidateSchema.index({ agencyId: 1, nationalIdNumber: 1 });
candidateSchema.index({ agencyId: 1, status: 1, agentId: 1 }); // Compound for common query pattern
candidateSchema.index({ agencyId: 1, paymentStatus: 1 }); // For fee tracking
candidateSchema.index({ agencyId: 1, departureStatus: 1, flightDate: 1 });
candidateSchema.index({ agencyId: 1, feimsApprovalStatus: 1 });
candidateSchema.index({ agencyId: 1, shramExpiryDate: 1 });
candidateSchema.index({ agencyId: 1, plksExpiryDate: 1 }); // Malaysia PLKS expiry alerts
candidateSchema.index({ agencyId: 1, vlnExpiryDate: 1 }); // Malaysia VLN expiry alerts
candidateSchema.index({
  fullName: "text",
  phone: "text",
  nationalIdNumber: "text",
});

candidateSchema.virtual("daysSinceRegistered").get(function () {
  const now = new Date();
  const registered = this.registeredAt || this.createdAt;
  return Math.floor((now - registered) / (1000 * 60 * 60 * 24));
});

candidateSchema.virtual("dateOfBirthBS").get(function () {
  return this.dateOfBirth ? formatBSDisplay(this.dateOfBirth) : null;
});

candidateSchema.virtual("registeredAtBS").get(function () {
  return this.registeredAt ? formatBSDisplay(this.registeredAt) : null;
});

candidateSchema.virtual("departedAtBS").get(function () {
  return this.departedAt ? formatBSDisplay(this.departedAt) : null;
});

candidateSchema.virtual("visaReceivedDateBS").get(function () {
  return this.visaReceivedDate ? formatBSDisplay(this.visaReceivedDate) : null;
});

candidateSchema.virtual("flightDateBS").get(function () {
  return this.flightDate ? formatBSDisplay(this.flightDate) : null;
});

candidateSchema.set("toJSON", { virtuals: true });
candidateSchema.set("toObject", { virtuals: true });

export const PREDEFINED_SKILLS_LIST = PREDEFINED_SKILLS;
export const DESIRED_COUNTRIES_LIST = DESIRED_COUNTRIES;
export const EDUCATION_LEVELS_LIST = EDUCATION_LEVELS;
export const STATUS_VALUES_LIST = STATUS_VALUES;
export const NEPAL_PROVINCES_LIST = NEPAL_PROVINCES;
export const NEPAL_DISTRICTS_LIST = NEPAL_DISTRICTS;

export default mongoose.model("Candidate", candidateSchema);
