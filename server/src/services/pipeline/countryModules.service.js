/**
 * countryModules.service.js
 *
 * Batch board queries for country-specific pipeline stages.
 *
 * Gulf:    calling_visa → embassy stamping → visa_stamped
 * Malaysia: calling_visa (VLN/VDR) → PLKS e-sticker
 *
 * Neither board crosses model boundaries — candidate fields are enough.
 * Demand is populated for company name and letter number only.
 */

import Candidate from '../../models/Candidate.js';

// ─── Gulf Visa Board ──────────────────────────────────────────────────────────

const GULF_BOARD_STATUSES = [
  'calling_visa_pending',
  'calling_visa_received',
  'visa_applied',
  'visa_stamped',
  'visa_rejected'
];

const DEMAND_SELECT = 'employerCompanyName employerCountry demandLetterNumber purbaSwukritiNumber';
const GULF_CANDIDATE_SELECT = [
  'fullName', 'status', 'desiredCountry', 'passportNumber',
  'visaNumber', 'visaReceivedDate', 'visaExpiryDate', 'visaFileUrl',
  'demandId', 'updatedAt'
].join(' ');

export async function getGulfVisaBoard(agencyId) {
  const candidates = await Candidate.find({
    agencyId,
    status: { $in: GULF_BOARD_STATUSES }
  })
    .sort({ updatedAt: -1 })
    .select(GULF_CANDIDATE_SELECT)
    .populate('demandId', DEMAND_SELECT)
    .lean();

  const rows = candidates.map(c => ({
    _id:               c._id,
    fullName:          c.fullName,
    status:            c.status,
    country:           c.demandId?.employerCountry || c.desiredCountry || null,
    company:           c.demandId?.employerCompanyName || null,
    demandLetterNo:    c.demandId?.demandLetterNumber || null,
    purbaSwukritiNo:   c.demandId?.purbaSwukritiNumber || null,
    passportNumber:    c.passportNumber || null,
    visaNumber:        c.visaNumber || null,
    visaReceivedDate:  c.visaReceivedDate || null,
    visaExpiryDate:    c.visaExpiryDate || null,
    visaFileUrl:       c.visaFileUrl || null,
    updatedAt:         c.updatedAt
  }));

  return {
    callingVisa:     rows.filter(r => ['calling_visa_pending', 'calling_visa_received'].includes(r.status)),
    embassyStamping: rows.filter(r => r.status === 'visa_applied'),
    completed:       rows.filter(r => ['visa_stamped', 'visa_rejected'].includes(r.status)),
    total:           rows.length
  };
}

// ─── Malaysia VLN / PLKS Board ────────────────────────────────────────────────

const PLKS_ONLY_STATUSES  = ['plks_applied', 'plks_received', 'esticker_applied', 'esticker_received'];
const VLN_CALLING_STATUSES = ['calling_visa_pending', 'calling_visa_received'];

const MALAYSIA_CANDIDATE_SELECT = [
  'fullName', 'status', 'desiredCountry', 'passportNumber',
  'vlnNumber', 'vlnReceivedDate', 'vlnExpiryDate', 'vlnFileUrl',
  'fwcmsCallingLetterNumber', 'fwcmsReceivedDate',
  'fomemaReferenceNumber', 'bestinetBiometricRef',
  'plksNumber', 'plksIssuedDate', 'plksExpiryDate', 'plksFileUrl',
  'demandId', 'updatedAt'
].join(' ');

export async function getMalaysiaPlksBoard(agencyId) {
  const candidates = await Candidate.find({
    agencyId,
    $or: [
      { status: { $in: PLKS_ONLY_STATUSES } },
      { status: { $in: VLN_CALLING_STATUSES }, desiredCountry: 'Malaysia' }
    ]
  })
    .sort({ updatedAt: -1 })
    .select(MALAYSIA_CANDIDATE_SELECT)
    .populate('demandId', DEMAND_SELECT)
    .lean();

  const rows = candidates.map(c => ({
    _id:                    c._id,
    fullName:               c.fullName,
    status:                 c.status,
    company:                c.demandId?.employerCompanyName || null,
    demandLetterNo:         c.demandId?.demandLetterNumber || null,
    purbaSwukritiNo:        c.demandId?.purbaSwukritiNumber || null,
    passportNumber:         c.passportNumber || null,
    // VLN
    vlnNumber:              c.vlnNumber || null,
    vlnReceivedDate:        c.vlnReceivedDate || null,
    vlnExpiryDate:          c.vlnExpiryDate || null,
    fwcmsCallingLetterNumber: c.fwcmsCallingLetterNumber || null,
    fwcmsReceivedDate:      c.fwcmsReceivedDate || null,
    // FOMEMA
    fomemaReferenceNumber:  c.fomemaReferenceNumber || null,
    bestinetBiometricRef:   c.bestinetBiometricRef || null,
    // PLKS
    plksNumber:             c.plksNumber || null,
    plksIssuedDate:         c.plksIssuedDate || null,
    plksExpiryDate:         c.plksExpiryDate || null,
    updatedAt:              c.updatedAt
  }));

  return {
    vlnStage:  rows.filter(r => VLN_CALLING_STATUSES.includes(r.status)),
    plksStage: rows.filter(r => PLKS_ONLY_STATUSES.includes(r.status)),
    total:     rows.length
  };
}
