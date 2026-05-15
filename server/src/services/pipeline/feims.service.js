/**
 * feims.service.js
 *
 * FEIMS (Foreign Employment Information Management System) form assistant.
 *
 * DoFE's FEIMS portal has no public API. This service structures all
 * FEIMS-required data from our database so the UI can present it as a
 * copy-friendly form that reduces manual transcription errors by staff.
 *
 * It also generates the submission checklist that tells staff exactly
 * which documents to upload in FEIMS before submitting.
 */

import Candidate from '../../models/Candidate.js';
import Medical from '../../models/Medical.js';
import Orientation from '../../models/Orientation.js';
import InsuranceSsf from '../../models/InsuranceSsf.js';
import Passport from '../../models/Passport.js';
import JobDemand from '../../models/JobDemand.js';
import { formatBSDisplay } from '../../utils/bsDate.js';
import { FEIMS_REQUIRED_FIELDS } from '../../constants/workflow.js';
import { getCountryRules } from '../../constants/countryRules.js';

/**
 * Builds the FEIMS pre-registration data packet for a candidate.
 * This is what staff types into the FEIMS portal.
 *
 * @param {string|ObjectId} candidateId
 * @param {string|ObjectId} agencyId
 * @returns {Promise<object>}
 */
export async function getFeimsPacket(candidateId, agencyId) {
  const [candidate, medical, orientation, insurance, passport] = await Promise.all([
    Candidate.findOne({ _id: candidateId, agencyId }).populate('demandId').lean(),
    Medical.findOne({ candidateId, agencyId }).sort({ createdAt: -1 }).lean(),
    Orientation.findOne({ candidateId, agencyId }).sort({ createdAt: -1 }).lean(),
    InsuranceSsf.findOne({ candidateId, agencyId }).sort({ createdAt: -1 }).lean(),
    Passport.findOne({ candidateId, agencyId }).lean()
  ]);

  if (!candidate) return null;

  const demand = candidate.demandId;
  const countryRules = demand?.employerCountry
    ? getCountryRules(demand.employerCountry)
    : null;

  // ── FEIMS data fields (what goes into the portal form) ────────────────────
  const feimsData = {
    fullName: candidate.fullName,
    fullNameNepali: candidate.fullNameNepali || null,
    dateOfBirthAD: candidate.dateOfBirth
      ? new Date(candidate.dateOfBirth).toLocaleDateString('en-CA')
      : null,
    dateOfBirthBS: candidate.dateOfBirth
      ? formatBSDisplay(candidate.dateOfBirth)
      : null,
    gender: candidate.gender,
    nationalIdNumber: candidate.nationalIdNumber,
    phone: candidate.phone,
    permanentProvince: candidate.permanentProvince,
    permanentDistrict: candidate.permanentDistrict,
    permanentMunicipality: candidate.permanentMunicipality,
    permanentWardNo: candidate.permanentWardNo,
    passportNumber: passport?.passportNumber || candidate.passportNumber || null,
    passportExpiryDate: passport?.expiryDate
      ? new Date(passport.expiryDate).toLocaleDateString('en-CA')
      : null,
    passportIssuedDistrict: passport?.issuedDistrict || null,
    destinationCountry: demand?.employerCountry || candidate.desiredCountry || null,
    jobCategory: demand?.jobCategory || candidate.desiredJobCategory || null,
    employerCompany: demand?.employerCompanyName || null,
    demandLetterNumber: demand?.demandLetterNumber || null,
    purbaSwukritiNumber: demand?.purbaSwukritiNumber || null,
    medicalCenter: medical?.medicalCenter || null,
    medicalResult: medical?.result || null,
    medicalConductedDate: medical?.conductedDate
      ? new Date(medical.conductedDate).toLocaleDateString('en-CA')
      : null,
    orientationCenter: orientation?.trainingCenter || null,
    orientationCertificate: orientation?.certificateNumber || null,
    insurancePolicyNumber: insurance?.insurancePolicyNumber || null,
    ssfRegistrationNumber: insurance?.ssfRegistrationNumber || null
  };

  // ── Missing field warnings ────────────────────────────────────────────────
  const missingFields = FEIMS_REQUIRED_FIELDS
    .filter(f => !feimsData[f.key])
    .map(f => f.label);

  // ── Document checklist for FEIMS upload ───────────────────────────────────
  const documentChecklist = buildDocumentChecklist({
    candidate, medical, orientation, insurance, passport, demand, countryRules
  });

  // ── Submission readiness ──────────────────────────────────────────────────
  const submissionReady = missingFields.length === 0
    && documentChecklist.filter(d => d.required && !d.available).length === 0;

  return {
    candidateId: candidate._id,
    candidateName: candidate.fullName,
    currentFeimsStatus: {
      registrationNumber: candidate.feimsRegistrationNumber || null,
      submittedAt: candidate.feimsSubmittedAt || null,
      approvalStatus: candidate.feimsApprovalStatus || 'pending',
      dofeFileNumber: candidate.dofeFileNumber || null
    },
    feimsData,
    missingFields,
    documentChecklist,
    submissionReady,
    countryRules
  };
}

/**
 * Generates the FEIMS checklist (progress view) used by getCandidateStatus.
 */
export async function getFeimsChecklist(candidateId, agencyId) {
  const [candidate, orientation, medical, insurance, passport] = await Promise.all([
    Candidate.findOne({ _id: candidateId, agencyId }).lean(),
    Orientation.findOne({ candidateId, agencyId }),
    Medical.findOne({ candidateId, agencyId, result: 'fit' }),
    InsuranceSsf.findOne({ candidateId, agencyId }),
    Passport.findOne({ candidateId, agencyId })
  ]);

  if (!candidate) return null;

  const checklist = [
    {
      id: 'candidate_registered',
      label: 'Candidate registered',
      done: true,
      detail: `${candidate.fullName} | NID: ${candidate.nationalIdNumber || 'N/A'}`
    },
    {
      id: 'demand_assigned',
      label: 'Demand letter assigned',
      done: !!candidate.demandId,
      detail: candidate.demandId ? `Demand ID: ${candidate.demandId}` : null
    },
    {
      id: 'passport_collected',
      label: 'Passport collected',
      done: !!passport,
      detail: passport
        ? `No. ${passport.passportNumber}, status: ${passport.custodyStatus}`
        : 'Not collected'
    },
    {
      id: 'feims_registered',
      label: 'FEIMS pre-registration',
      done: !!candidate.feimsRegistrationNumber,
      detail: candidate.feimsRegistrationNumber
        ? `Reg. No. ${candidate.feimsRegistrationNumber}`
        : 'Not yet submitted to FEIMS'
    },
    {
      id: 'medical_cleared',
      label: 'Medical clearance (GAMCA/WAFID)',
      done: medical?.result === 'fit',
      detail: medical
        ? `Result: ${medical.result}, Center: ${medical.medicalCenter || 'N/A'}`
        : 'Not completed'
    },
    {
      id: 'orientation_complete',
      label: 'Pre-departure orientation',
      done: orientation?.completionStatus === 'completed',
      detail: orientation
        ? `${orientation.trainingCenter || 'N/A'}, Cert: ${orientation.certificateNumber || 'pending'}`
        : 'Not scheduled'
    },
    {
      id: 'orientation_cert_uploaded',
      label: 'Orientation certificate uploaded',
      done: !!orientation?.certificateFileUrl,
      warning: orientation?.completionStatus === 'completed' && !orientation?.certificateFileUrl
        ? 'Orientation completed but certificate not uploaded'
        : null
    },
    {
      id: 'insurance_ssf_done',
      label: 'Insurance & SSF',
      done: insurance?.overallStatus === 'completed',
      detail: insurance ? `Status: ${insurance.overallStatus}` : 'Not started'
    },
    {
      id: 'visa_received',
      label: 'Visa received',
      done: !!candidate.visaNumber,
      detail: candidate.visaNumber ? `Visa No. ${candidate.visaNumber}` : 'Pending'
    },
    {
      id: 'shram_issued',
      label: 'Shram Swukriti issued',
      done: !!candidate.shramSwikritiNumber,
      detail: candidate.shramSwikritiNumber
        ? `No. ${candidate.shramSwikritiNumber}`
        : 'Not yet issued'
    }
  ];

  const completed = checklist.filter(i => i.done).length;
  const total = checklist.length;

  return {
    checklist,
    progress: Math.round((completed / total) * 100),
    completedItems: completed,
    totalItems: total
  };
}

// ─── FEIMS queue (batch center) ───────────────────────────────────────────────

const QUEUE_STATUSES = [
  'compliance_complete',
  'orientation_scheduled', 'orientation_completed', 'orientation_absent',
  'purba_swukriti_applied', 'purba_swukriti_issued',
  'visa_applied', 'visa_stamped', 'visa_rejected',
  'plks_applied', 'plks_received', 'esticker_applied', 'esticker_received',
  'feims_pending', 'feims_submitted', 'feims_registered'
];

const QUEUE_REQUIRED_FIELDS = [
  { key: 'fullName',              label: 'Full name' },
  { key: 'dateOfBirth',          label: 'Date of birth' },
  { key: 'gender',               label: 'Gender' },
  { key: 'nationalIdNumber',     label: 'Citizenship number' },
  { key: 'phone',                label: 'Phone' },
  { key: 'permanentDistrict',    label: 'District' },
  { key: 'permanentMunicipality',label: 'Municipality' },
  { key: 'permanentWardNo',      label: 'Ward number' },
];

/**
 * Returns all candidates in FEIMS-adjacent stages, bucketed by submission state.
 * Lightweight — single DB query, no cross-model joins for readiness.
 */
export async function getFeimsQueue(agencyId) {
  const candidates = await Candidate.find({ agencyId, status: { $in: QUEUE_STATUSES } })
    .populate('demandId', 'employerCompanyName employerCountry demandLetterNumber')
    .sort({ updatedAt: -1 })
    .lean();

  const ready = [], submitted = [], registered = [], approaching = [];

  for (const c of candidates) {
    const missingFields = QUEUE_REQUIRED_FIELDS
      .filter(f => !c[f.key])
      .map(f => f.label);

    if (!c.passportNumber && !c.passportId) missingFields.push('Passport number');
    if (!c.demandId)                         missingFields.push('Demand letter');

    const row = {
      _id:                    c._id,
      fullName:               c.fullName,
      status:                 c.status,
      country:                c.demandCountry || c.desiredCountry,
      demandCompany:          c.demandCompany || c.demandId?.employerCompanyName,
      demandLetterNumber:     c.demandId?.demandLetterNumber,
      feimsRegistrationNumber:c.feimsRegistrationNumber || null,
      dofeFileNumber:         c.dofeFileNumber         || null,
      feimsSubmittedAt:       c.feimsSubmittedAt       || null,
      shramSwikritiNumber:    c.shramSwikritiNumber    || null,
      missingCount:           missingFields.length,
      missingFields,
    };

    if (c.feimsRegistrationNumber) {
      registered.push(row);
    } else if (c.feimsSubmittedAt) {
      submitted.push(row);
    } else if (c.status === 'feims_pending' && missingFields.length === 0) {
      ready.push(row);
    } else {
      approaching.push(row);
    }
  }

  return { ready, submitted, registered, approaching };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildDocumentChecklist({ candidate, medical, orientation, insurance, passport, demand, countryRules }) {
  return [
    {
      id: 'passport_copy',
      label: 'Passport copy (bio-data page)',
      required: true,
      available: !!passport?.scannedImageUrl,
      fileUrl: passport?.scannedImageUrl || null
    },
    {
      id: 'citizenship_copy',
      label: 'Citizenship certificate copy',
      required: true,
      available: !!candidate.nationalIdNumber,
      detail: `NID: ${candidate.nationalIdNumber || 'missing'}`
    },
    {
      id: 'demand_letter',
      label: 'Demand letter (employer-issued)',
      required: true,
      available: !!demand?.demandLetterFileUrl,
      fileUrl: demand?.demandLetterFileUrl || null
    },
    {
      id: 'medical_report',
      label: 'Medical fitness report (GAMCA/WAFID)',
      required: true,
      available: !!(medical?.result === 'fit' && medical?.reportFileUrl),
      fileUrl: medical?.reportFileUrl || null
    },
    {
      id: 'orientation_certificate',
      label: 'Orientation certificate (PDOT)',
      required: true,
      available: !!(orientation?.completionStatus === 'completed' && orientation?.certificateFileUrl),
      fileUrl: orientation?.certificateFileUrl || null
    },
    {
      id: 'insurance_receipt',
      label: 'Foreign employment insurance receipt',
      required: true,
      available: !!insurance?.insurancePaidReceiptUrl,
      fileUrl: insurance?.insurancePaidReceiptUrl || null
    },
    {
      id: 'ssf_receipt',
      label: 'SSF contribution receipt',
      required: true,
      available: !!insurance?.ssfReceiptUrl,
      fileUrl: insurance?.ssfReceiptUrl || null
    },
    {
      id: 'power_of_attorney',
      label: 'Power of attorney (POA)',
      required: true,
      available: !!demand?.powerOfAttorneyFileUrl,
      fileUrl: demand?.powerOfAttorneyFileUrl || null
    },
    {
      id: 'esticker',
      label: 'E-sticker / PLKS (country-specific)',
      required: countryRules?.requiresEsticker === true,
      available: !!candidate.eStickerNumber,
      detail: candidate.eStickerNumber || 'Not obtained'
    }
  ];
}
