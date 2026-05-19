import mongoose from "mongoose";

const departedRecordSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },

    // References (soft — originals may be deleted)
    originalCandidateId: { type: mongoose.Schema.Types.ObjectId },
    originalPassportId: { type: mongoose.Schema.Types.ObjectId },
    demandId: { type: mongoose.Schema.Types.ObjectId, ref: "JobDemand" },

    // Personal
    fullName: { type: String, required: true },
    fullNameNepali: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String },
    phone: { type: String },
    permanentDistrict: { type: String },
    permanentAddress: { type: String },
    nationalIdNumber: { type: String },

    // Passport
    passportNumber: { type: String },
    passportIssueDate: { type: Date },
    passportExpiryDate: { type: Date },
    passportIssuedDistrict: { type: String },

    // Job / Demand
    employerCountry: { type: String },
    employerCompanyName: { type: String },
    jobCategory: { type: String },
    demandLetterNumber: { type: String },

    // Flight / Departure
    flightDate: { type: Date },
    departedAt: { type: Date, default: Date.now },
    flightNumber: { type: String },
    portOfDeparture: { type: String },

    // Visa / Shram
    visaNumber: { type: String },
    visaExpiryDate: { type: Date },
    shramNumber: { type: String },
    shramExpiryDate: { type: Date },
    labourPermitNumber: { type: String },

    // Financial
    serviceFee: { type: Number },
    feePaid: { type: Number },
    feeBalance: { type: Number },

    // Agent / Sponsor
    agentId: { type: mongoose.Schema.Types.ObjectId },
    agentName: { type: String },
    sponsorName: { type: String },

    // Return tracking
    returnStatus: {
      type: String,
      enum: ["abroad", "returned", "extended", "absconded"],
      default: "abroad",
    },
    returnDate: { type: Date },
    returnNotes: { type: String },

    // Files snapshot
    files: {
      passportFile: String,
      visaFile: String,
      feimsFile: String,
      departureFile: String,
      medicalFile: String,
      insuranceFile: String,
    },

    departedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Archive tiering — records older than 1 year are marked archived
    // so hot queries can use a partial index and skip cold data
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Hot queries — partial index skips archived docs so scans stay fast
departedRecordSchema.index(
  { agencyId: 1, departedAt: -1 },
  { partialFilterExpression: { isArchived: false } }
);
departedRecordSchema.index(
  { agencyId: 1, employerCountry: 1, departedAt: -1 },
  { partialFilterExpression: { isArchived: false } }
);
departedRecordSchema.index(
  { agencyId: 1, returnStatus: 1 },
  { partialFilterExpression: { isArchived: false } }
);
// Archive queries (old records)
departedRecordSchema.index({ agencyId: 1, isArchived: 1, departedAt: -1 });
departedRecordSchema.index({ agencyId: 1, originalCandidateId: 1 }); // archive lookups by source candidate
departedRecordSchema.index({
  fullName: "text",
  passportNumber: "text",
  phone: "text",
});

export default mongoose.model("DepartedRecord", departedRecordSchema);
