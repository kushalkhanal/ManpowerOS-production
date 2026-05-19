import { getChecklistMeta } from "../utils/candidateChecklist.js";

// ─── Phase 1: Passport Collection ──────────────────────────────────────────
export const buildPassportCollectionColumn = (
  passport,
  checklistMap = {},
  stageNotes = {},
) => {
  const withAgency = passport?.custodyStatus === "with_agency";
  const checkItems = [
    {
      key: "passport_received",
      label: "Passport received from candidate",
      ...getChecklistMeta(
        checklistMap,
        "passport_collection",
        "passport_received",
        withAgency,
      ),
    },
    {
      key: "passport_verified",
      label: "Passport details verified",
      ...getChecklistMeta(
        checklistMap,
        "passport_collection",
        "passport_verified",
        withAgency && !!passport?.passportNumber,
      ),
    },
    {
      key: "passport_renewed",
      label: "Renewal done (if needed)",
      ...getChecklistMeta(
        checklistMap,
        "passport_collection",
        "passport_renewed",
        false,
      ),
    },
  ];

  let status = "pending";
  if (passport) {
    if (passport.custodyStatus === "submitted_embassy") status = "in_progress";
    else if (passport.custodyStatus === "with_agency")
      status = checkItems.every((i) => i.done) ? "complete" : "in_progress";
    else status = "in_progress";
  }

  let daysUntilExpiry = null;
  if (passport?.expiryDate) {
    daysUntilExpiry = Math.ceil(
      (new Date(passport.expiryDate) - new Date()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 0) status = "expired";
    else if (daysUntilExpiry < 180 && status !== "pending") status = "expiring";
  }

  return {
    id: "passport_collection",
    title: "Passport Collection",
    subtitle: passport?.passportNumber || "No passport linked",
    icon: "passport",
    phase: 1,
    phaseLabel: "Phase 1 — Pre-processing",
    status,
    requiredFor: "Medical check",
    data: passport,
    uploads: passport?.scannedImageUrl
      ? [{ label: "Passport Scan", url: passport.scannedImageUrl }]
      : [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: passport?.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: passport?.expiryDate || null,
    daysUntilExpiry,
    note: stageNotes["passport_collection"] || "",
    canEdit: false,
    canDelete: false,
  };
};

// ─── Phase 1: Medical Check ─────────────────────────────────────────────────
export const buildMedicalColumn = (medical, checklistMap = {}, stageNotes = {}) => {
  const checkItems = [
    {
      key: "medical_scheduled",
      label: "Medical scheduled",
      ...getChecklistMeta(
        checklistMap,
        "medical",
        "medical_scheduled",
        !!medical?.scheduledDate,
      ),
    },
    {
      key: "medical_conducted",
      label: "Medical conducted",
      ...getChecklistMeta(
        checklistMap,
        "medical",
        "medical_conducted",
        !!medical?.conductedDate,
      ),
    },
    {
      key: "result_received",
      label: "Result received",
      ...getChecklistMeta(
        checklistMap,
        "medical",
        "result_received",
        !!medical?.result && medical.result !== "pending",
      ),
    },
    {
      key: "report_uploaded",
      label: "Report uploaded",
      ...getChecklistMeta(
        checklistMap,
        "medical",
        "report_uploaded",
        !!medical?.reportFileUrl,
      ),
    },
  ];

  let status = "pending";
  if (medical) {
    if (medical.result === "unfit") status = "blocked";
    else if (medical.result === "fit" && medical.reportFileUrl)
      status = "complete";
    else if (medical.scheduledDate || medical.conductedDate)
      status = "in_progress";
  }

  let daysUntilExpiry = null;
  if (medical?.reportExpiryDate) {
    daysUntilExpiry = Math.ceil(
      (new Date(medical.reportExpiryDate) - new Date()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 0) status = "expired";
    else if (daysUntilExpiry < 30 && status === "complete") status = "expiring";
  }

  return {
    id: "medical",
    title: "Medical clearance",
    subtitle: "GAMCA or Wafid",
    icon: "stethoscope",
    status,
    requiredFor: "FEIMS submission",
    data: medical,
    uploads: medical?.reportFileUrl
      ? [{ label: "Medical Report", url: medical.reportFileUrl }]
      : [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: medical?.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: medical?.reportExpiryDate || null,
    daysUntilExpiry,
    note: stageNotes["medical"] || "",
    canEdit: true,
    canDelete: true,
  };
};

// ─── Phase 2: Insurance & SSF ───────────────────────────────────────────────
export const buildInsuranceColumn = (
  insuranceSsf,
  checklistMap = {},
  stageNotes = {},
) => {
  const checkItems = [
    {
      key: "insurance_paid",
      label: "Insurance paid",
      ...getChecklistMeta(
        checklistMap,
        "insurance",
        "insurance_paid",
        !!insuranceSsf?.insurancePaidDate,
      ),
    },
    {
      key: "policy_generated",
      label: "Policy generated",
      ...getChecklistMeta(
        checklistMap,
        "insurance",
        "policy_generated",
        !!insuranceSsf?.insurancePolicyNumber,
      ),
    },
    {
      key: "ssf_registered",
      label: "SSF registered",
      ...getChecklistMeta(
        checklistMap,
        "insurance",
        "ssf_registered",
        !!insuranceSsf?.ssfPaidDate,
      ),
    },
    {
      key: "ssf_receipt",
      label: "SSF receipt",
      ...getChecklistMeta(
        checklistMap,
        "insurance",
        "ssf_receipt",
        !!insuranceSsf?.ssfReceiptNumber,
      ),
    },
  ];

  let status = "pending";
  if (insuranceSsf) {
    if (insuranceSsf.overallStatus === "completed") status = "complete";
    else if (insuranceSsf.overallStatus === "partially_done")
      status = "in_progress";
  }

  let daysUntilExpiry = null;
  if (insuranceSsf?.insuranceExpiryDate) {
    daysUntilExpiry = Math.ceil(
      (new Date(insuranceSsf.insuranceExpiryDate) - new Date()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 0) status = "expired";
    else if (daysUntilExpiry < 30 && status === "complete") status = "expiring";
  }

  return {
    id: "insurance",
    title: "Insurance & SSF",
    subtitle: "Social Security Fund",
    icon: "shield",
    phase: 2,
    phaseLabel: "Phase 2 — Insurance & Visa",
    status,
    requiredFor: "Calling visa",
    data: insuranceSsf,
    uploads: [
      ...(insuranceSsf?.insurancePaidReceiptUrl
        ? [
            {
              label: "Insurance Receipt",
              url: insuranceSsf.insurancePaidReceiptUrl,
            },
          ]
        : []),
      ...(insuranceSsf?.ssfReceiptUrl
        ? [{ label: "SSF Receipt", url: insuranceSsf.ssfReceiptUrl }]
        : []),
    ],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: insuranceSsf?.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: insuranceSsf?.insuranceExpiryDate || null,
    daysUntilExpiry,
    note: stageNotes["insurance"] || "",
    canEdit: true,
    canDelete: true,
  };
};

// ─── Phase 2: Calling Visa (Demand Letter) ──────────────────────────────────
export const buildCallingVisaColumn = (
  candidate,
  demand,
  checklistMap = {},
  stageNotes = {},
) => {
  const checkItems = [
    {
      key: "demand_letter_confirmed",
      label: "Demand letter confirmed",
      ...getChecklistMeta(
        checklistMap,
        "calling_visa",
        "demand_letter_confirmed",
        !!candidate.demandId,
      ),
    },
    {
      key: "visa_number_obtained",
      label: "Visa number obtained from employer",
      ...getChecklistMeta(
        checklistMap,
        "calling_visa",
        "visa_number_obtained",
        !!candidate.visaNumber,
      ),
    },
    {
      key: "visa_approval_confirmed",
      label: "Visa approval confirmed",
      ...getChecklistMeta(
        checklistMap,
        "calling_visa",
        "visa_approval_confirmed",
        false,
      ),
    },
  ];

  let status = "pending";
  if (candidate.demandId) {
    if (candidate.visaNumber)
      status = checkItems.every((i) => i.done) ? "complete" : "in_progress";
    else status = "in_progress";
  }

  return {
    id: "calling_visa",
    title: "Calling Visa",
    subtitle: demand?.employerCountry
      ? `Demand: ${demand.employerCountry}`
      : "Employer demand letter",
    icon: "file",
    phase: 2,
    phaseLabel: "Phase 2 — Insurance & Visa",
    status,
    requiredFor: "Visa stamping",
    data: {
      demandId: candidate.demandId,
      visaNumber: candidate.visaNumber,
      visaReceivedDate: candidate.visaReceivedDate,
      demandCountry: demand?.employerCountry || "",
      demandCompany: demand?.employerCompanyName || "",
    },
    uploads: [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: null,
    daysUntilExpiry: null,
    note: stageNotes["calling_visa"] || "",
    canEdit: true,
    canDelete: false,
  };
};

// ─── Phase 2: Visa Stamping ─────────────────────────────────────────────────
export const buildVisaColumn = (
  candidate,
  passport,
  checklistMap = {},
  stageNotes = {},
) => {
  const checkItems = [
    {
      key: "embassy_submitted",
      label: "Passport submitted to embassy",
      ...getChecklistMeta(
        checklistMap,
        "visa",
        "embassy_submitted",
        passport?.custodyStatus === "submitted_embassy",
      ),
    },
    {
      key: "visa_stamped",
      label: "Visa stamped on passport",
      ...getChecklistMeta(
        checklistMap,
        "visa",
        "visa_stamped",
        !!candidate.visaFileUrl,
      ),
    },
    {
      key: "passport_returned",
      label: "Passport returned to office",
      ...getChecklistMeta(
        checklistMap,
        "visa",
        "passport_returned",
        !!candidate.visaFileUrl && passport?.custodyStatus === "with_agency",
      ),
    },
  ];

  let status = "pending";
  if (candidate.visaNumber) {
    if (candidate.visaFileUrl) status = "complete";
    else if (passport?.custodyStatus === "submitted_embassy")
      status = "in_progress";
    else status = "in_progress";
  }

  return {
    id: "visa",
    title: "Visa Stamping",
    subtitle: "Embassy visa stamp",
    icon: "stamp",
    phase: 2,
    phaseLabel: "Phase 2 — Insurance & Visa",
    status,
    requiredFor: "Flight booking",
    data: {
      visaNumber: candidate.visaNumber,
      visaReceivedDate: candidate.visaReceivedDate,
      visaExpiryDate: candidate.visaExpiryDate,
      visaFileUrl: candidate.visaFileUrl,
    },
    uploads: candidate.visaFileUrl
      ? [{ label: "Visa Document", url: candidate.visaFileUrl }]
      : [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: candidate.visaExpiryDate || null,
    daysUntilExpiry: candidate.visaExpiryDate
      ? Math.ceil(
          (new Date(candidate.visaExpiryDate) - new Date()) /
            (1000 * 60 * 60 * 24),
        )
      : null,
    note: stageNotes["visa"] || "",
    canEdit: true,
    canDelete: true,
  };
};

// ─── Phase 2: Service Fee ───────────────────────────────────────────────────
export const buildFeeColumn = (
  transactions,
  serviceFeeAgreed,
  checklistMap = {},
  stageNotes = {},
) => {
  const totalReceived = transactions.reduce((sum, t) => sum + t.amountNPR, 0);
  const checkItems = [
    {
      key: "fee_agreed",
      label: "Fee agreed",
      ...getChecklistMeta(
        checklistMap,
        "fee",
        "fee_agreed",
        !!serviceFeeAgreed,
      ),
    },
    {
      key: "partial_payment",
      label: "Partial payment",
      ...getChecklistMeta(
        checklistMap,
        "fee",
        "partial_payment",
        totalReceived > 0,
      ),
    },
    {
      key: "full_payment",
      label: "Full payment",
      ...getChecklistMeta(
        checklistMap,
        "fee",
        "full_payment",
        totalReceived >= (serviceFeeAgreed || 0),
      ),
    },
    {
      key: "receipt_issued",
      label: "Receipt issued",
      ...getChecklistMeta(
        checklistMap,
        "fee",
        "receipt_issued",
        transactions.some((t) => t.receiptUrl),
      ),
    },
  ];
  const feeLastUpdatedAt = transactions.reduce((latest, t) => {
    const ts = t?.updatedAt || t?.createdAt || t?.paidAt;
    return ts && (!latest || new Date(ts) > new Date(latest)) ? ts : latest;
  }, null);

  let status = "pending";
  if (transactions.length > 0) {
    if (totalReceived >= (serviceFeeAgreed || 0)) status = "complete";
    else status = "in_progress";
  }

  return {
    id: "fee",
    title: "Service Fee",
    subtitle: "Payment collection",
    icon: "rupee",
    phase: 2,
    phaseLabel: "Phase 2 — Insurance & Visa",
    status,
    requiredFor: "Visa processing",
    data: { transactions, totalReceived, serviceFeeAgreed },
    uploads: transactions
      .filter((t) => t.receiptUrl)
      .slice(0, 3)
      .map((t, idx) => ({ label: `Receipt ${idx + 1}`, url: t.receiptUrl })),
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: feeLastUpdatedAt,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: null,
    daysUntilExpiry: null,
    note: stageNotes["fee"] || "",
    canEdit: true,
    canDelete: false,
  };
};

// ─── Phase 3: Flight Booking ────────────────────────────────────────────────
export const buildFlightColumn = (candidate, checklistMap = {}, stageNotes = {}) => {
  const checkItems = [
    {
      key: "ticket_booked",
      label: "Flight ticket booked",
      ...getChecklistMeta(
        checklistMap,
        "flight",
        "ticket_booked",
        !!candidate.flightDate,
      ),
    },
    {
      key: "ticket_confirmed",
      label: "Flight number confirmed",
      ...getChecklistMeta(
        checklistMap,
        "flight",
        "ticket_confirmed",
        !!candidate.flightNumber,
      ),
    },
    {
      key: "airline_confirmed",
      label: "Airline confirmed",
      ...getChecklistMeta(
        checklistMap,
        "flight",
        "airline_confirmed",
        !!candidate.airline,
      ),
    },
    {
      key: "airport_time_set",
      label: "Airport report time set",
      ...getChecklistMeta(
        checklistMap,
        "flight",
        "airport_time_set",
        !!candidate.airportReportingTime,
      ),
    },
  ];

  let status = "pending";
  if (candidate.flightDate) {
    status =
      candidate.flightNumber && candidate.airline ? "complete" : "in_progress";
  }

  return {
    id: "flight",
    title: "Flight Booking",
    subtitle: candidate.flightDate
      ? `${candidate.airline || ""} ${candidate.flightNumber || ""}`.trim() ||
        new Date(candidate.flightDate).toLocaleDateString("en-GB")
      : "Book departure flight",
    icon: "plane",
    phase: 3,
    phaseLabel: "Phase 3 — Travel Booking",
    status,
    requiredFor: "DoFE clearance",
    data: {
      flightDate: candidate.flightDate,
      flightNumber: candidate.flightNumber,
      airline: candidate.airline,
      airportReportingTime: candidate.airportReportingTime,
    },
    uploads: candidate.departureFileUrl
      ? [{ label: "Flight Ticket", url: candidate.departureFileUrl }]
      : [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: candidate.flightDate || null,
    daysUntilExpiry: candidate.flightDate
      ? Math.ceil(
          (new Date(candidate.flightDate) - new Date()) / (1000 * 60 * 60 * 24),
        )
      : null,
    note: stageNotes["flight"] || "",
    canEdit: true,
    canDelete: false,
  };
};

// ─── Phase 4: DoFE / FEIMS Clearance ────────────────────────────────────────
export const buildDofeColumn = (
  candidate,
  medical,
  orientation,
  insuranceSsf,
  checklistMap = {},
  stageNotes = {},
) => {
  const medicalValid =
    medical?.result === "fit" &&
    (!medical?.reportExpiryDate ||
      new Date(medical.reportExpiryDate) > new Date());

  const checkItems = [
    {
      key: "orientation_certified",
      label: "Orientation certified (PDOT)",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "orientation_certified",
        orientation?.completionStatus === "completed" &&
          !!orientation?.certificateFileUrl,
      ),
    },
    {
      key: "insurance_verified",
      label: "Insurance verified at DoFE",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "insurance_verified",
        insuranceSsf?.overallStatus === "completed",
      ),
    },
    {
      key: "medical_cert_valid",
      label: "Medical certificate valid",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "medical_cert_valid",
        medicalValid,
      ),
    },
    {
      key: "ssf_confirmed",
      label: "SSF (Social Security Fund)",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "ssf_confirmed",
        !!insuranceSsf?.ssfReceiptNumber,
      ),
    },
    {
      key: "shram_received",
      label: "Shram Swikriti received",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "shram_received",
        !!candidate.shramSwikritiNumber,
      ),
    },
    {
      key: "e_sticker_received",
      label: "E-Sticker received",
      ...getChecklistMeta(
        checklistMap,
        "dofe",
        "e_sticker_received",
        !!candidate.eStickerNumber,
      ),
    },
  ];

  let status = "pending";
  if (candidate.shramSwikritiNumber && candidate.eStickerNumber) {
    status = "complete";
  } else if (
    orientation ||
    candidate.shramSwikritiNumber ||
    candidate.eStickerNumber
  ) {
    status = "in_progress";
  }

  return {
    id: "dofe",
    title: "DoFE Clearance",
    subtitle: candidate.shramSwikritiNumber
      ? `Shram: ${candidate.shramSwikritiNumber}`
      : "Shram Swikriti",
    icon: "shield-check",
    phase: 4,
    phaseLabel: "Phase 4 — DoFE / FEIMS Clearance",
    status,
    requiredFor: "Final departure",
    data: {
      shramSwikritiNumber: candidate.shramSwikritiNumber,
      eStickerNumber: candidate.eStickerNumber,
      feimsSubmittedAt: candidate.feimsSubmittedAt,
      feimsFileUrl: candidate.feimsFileUrl,
      orientation: orientation || null,
    },
    uploads: [
      ...(candidate.feimsFileUrl
        ? [{ label: "FEIMS Document", url: candidate.feimsFileUrl }]
        : []),
      ...(orientation?.certificateFileUrl
        ? [
            {
              label: "Orientation Certificate",
              url: orientation.certificateFileUrl,
            },
          ]
        : []),
    ],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: null,
    daysUntilExpiry: null,
    note: stageNotes["dofe"] || "",
    canEdit: true,
    canDelete: false,
  };
};

// ─── Phase 5: Document Preparation ─────────────────────────────────────────
export const buildDocPrepColumn = (candidate, checklistMap = {}, stageNotes = {}) => {
  const checkItems = [
    {
      key: "all_docs_compiled",
      label: "All documents compiled",
      ...getChecklistMeta(checklistMap, "doc_prep", "all_docs_compiled", false),
    },
    {
      key: "ticket_ready",
      label: "Flight ticket printed / ready",
      ...getChecklistMeta(checklistMap, "doc_prep", "ticket_ready", false),
    },
    {
      key: "briefing_done",
      label: "Pre-departure briefing done",
      ...getChecklistMeta(checklistMap, "doc_prep", "briefing_done", false),
    },
    {
      key: "docs_handed",
      label: "Docs handed to candidate",
      ...getChecklistMeta(checklistMap, "doc_prep", "docs_handed", false),
    },
  ];

  const completedCount = checkItems.filter((i) => i.done).length;
  let status = "pending";
  if (completedCount === checkItems.length) status = "complete";
  else if (completedCount > 0) status = "in_progress";

  return {
    id: "doc_prep",
    title: "Document Prep",
    subtitle: "Pre-departure checklist",
    icon: "clipboard",
    phase: 5,
    phaseLabel: "Phase 5 — Final Departure",
    status,
    requiredFor: "Final departure",
    data: null,
    uploads: [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: null,
    checkItems,
    completedCount,
    totalCount: checkItems.length,
    expiryDate: null,
    daysUntilExpiry: null,
    note: stageNotes["doc_prep"] || "",
    canEdit: false,
    canDelete: false,
  };
};

// ─── Phase 5: Final Departure ───────────────────────────────────────────────
export const buildDepartureColumn = (
  candidate,
  checklistMap = {},
  stageNotes = {},
) => {
  const checkItems = [
    {
      key: "airport_reported",
      label: "Reported at airport",
      ...getChecklistMeta(checklistMap, "departure", "airport_reported", false),
    },
    {
      key: "flight_departed",
      label: "Flight departed",
      ...getChecklistMeta(
        checklistMap,
        "departure",
        "flight_departed",
        !!candidate.departedAt,
      ),
    },
    {
      key: "confirmation_received",
      label: "Safe arrival confirmed",
      ...getChecklistMeta(
        checklistMap,
        "departure",
        "confirmation_received",
        false,
      ),
    },
  ];

  let status = "pending";
  if (candidate.departedAt) status = "complete";
  else if (candidate.departureStatus === "scheduled") status = "in_progress";

  return {
    id: "departure",
    title: "Final Departure",
    subtitle: candidate.flightDate
      ? new Date(candidate.flightDate).toLocaleDateString("en-GB")
      : "Departure date",
    icon: "plane-takeoff",
    phase: 5,
    phaseLabel: "Phase 5 — Final Departure",
    status,
    requiredFor: "Completion",
    data: {
      flightDate: candidate.flightDate,
      flightNumber: candidate.flightNumber,
      airline: candidate.airline,
      airportReportingTime: candidate.airportReportingTime,
      departureStatus: candidate.departureStatus,
      departedAt: candidate.departedAt,
    },
    uploads: [],
    hasOverrides: checkItems.some((i) => i.overridden),
    lastUpdatedAt: candidate.departedAt || candidate.updatedAt || null,
    checkItems,
    completedCount: checkItems.filter((i) => i.done).length,
    totalCount: checkItems.length,
    expiryDate: candidate.flightDate || null,
    daysUntilExpiry: candidate.flightDate
      ? Math.ceil(
          (new Date(candidate.flightDate) - new Date()) / (1000 * 60 * 60 * 24),
        )
      : null,
    note: stageNotes["departure"] || "",
    canEdit: true,
    canDelete: false,
  };
};

export const getNextAction = (columns) => {
  const pending = columns.find((c) => c.status === "pending");
  const inProgress = columns.find((c) => c.status === "in_progress");

  if (pending) {
    const actions = {
      passport_collection: "Collect passport from candidate",
      medical: "Schedule GAMCA/Wafid medical check",
      insurance: "Complete insurance & SSF payment",
      calling_visa: "Confirm demand letter & visa number",
      visa: "Submit passport to embassy for stamping",
      fee: "Collect service fee",
      flight: "Book departure flight",
      dofe: "Submit for DoFE/FEIMS clearance (Shram)",
      doc_prep: "Compile all pre-departure documents",
      departure: "Confirm final departure",
    };
    return actions[pending.id] || `Start ${pending.title}`;
  }
  if (inProgress) {
    return `Complete ${inProgress.title} requirements`;
  }
  return null;
};

export const getBlockedBy = (columns) => {
  const blocked = columns.find((c) => c.status === "blocked");
  if (blocked?.id === "medical" && blocked.data?.result === "unfit") {
    return "Medical result: UNFIT — Schedule recheck";
  }
  return null;
};
