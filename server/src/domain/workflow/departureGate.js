/**
 * Departure gate — pure domain logic for evaluating departure readiness.
 *
 * Takes a plain "snapshot" object (already fetched by the caller) and returns
 * a structured result. No Mongoose, no Express, no I/O — caller is responsible
 * for loading the candidate, medical, orientation, insurance, passport, demand
 * documents and passing them in.
 *
 * Region-aware: the set of checks varies by destination country.
 *   - Gulf:     visa_stamped is required.
 *   - Malaysia: vln_received and plks_received are required;
 *               visa_stamped is NOT applicable.
 */

import { REGION, getRegionForCountry } from './countries.js';
import { getDepartureGateRequirements } from './pipelines.js';

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

/**
 * @typedef {Object} DepartureSnapshot
 * @property {Object} candidate     - Candidate document (lean).
 * @property {Object} [medical]     - Most recent Medical document.
 * @property {Object} [orientation] - Most recent Orientation document.
 * @property {Object} [insurance]   - Most recent InsuranceSsf document.
 * @property {Object} [passport]    - Linked Passport document.
 * @property {Object} [demand]      - Linked JobDemand document.
 */

/**
 * @typedef {Object} GateCheck
 * @property {string}  id
 * @property {string}  label
 * @property {boolean} passed
 * @property {string}  detail
 */

/**
 * @typedef {Object} GateResult
 * @property {boolean}     ready
 * @property {string[]}    blockers
 * @property {GateCheck[]} checks
 * @property {string}      region
 */

/**
 * Evaluate the departure gate for a snapshot.
 *
 * Pure function — same input always produces same output. The async-orchestrator
 * counterpart lives in services/pipeline/departureGate.service.js and wraps
 * this with database fetches.
 *
 * @param {DepartureSnapshot} snapshot
 * @param {Date} [now=new Date()]
 * @returns {GateResult}
 */
export function evaluateDepartureGateSnapshot(snapshot, now = new Date()) {
  const { candidate } = snapshot || {};
  if (!candidate) {
    return { ready: false, blockers: ['No candidate data'], checks: [], region: REGION.OTHER };
  }

  const country = candidate.desiredCountry || candidate.demandCountry || null;
  const region = getRegionForCountry(country);
  const requirements = getDepartureGateRequirements(country);

  const checks = buildChecks(snapshot, region, now);

  // Filter checks down to the requirements applicable to this region.
  const applicable = checks.filter(c => requirements.some(r => r.id === c.id));
  const blockers = applicable
    .filter(c => !c.passed && requirements.find(r => r.id === c.id)?.blocksDeparture)
    .map(c => c.label);

  return {
    ready: blockers.length === 0,
    blockers,
    checks: applicable,
    region
  };
}

// ─── Internal builders ───────────────────────────────────────────────────────

function buildChecks(snapshot, region, now) {
  const { candidate, medical, orientation, insurance, passport, demand } = snapshot;

  return [
    checkPassportValid(passport, now),
    checkDemandLetterValid(demand, now),
    checkDocumentsComplete(candidate),
    checkPurbaSwukriti(demand, now),
    checkFeimsRegistered(candidate),
    checkMedicalFit(medical),
    checkMedicalNotExpired(medical, now),
    checkOrientationComplete(orientation),
    checkInsurancePaid(insurance),
    checkSsfPaid(insurance),
    checkWelfarePaid(insurance),
    checkShramIssued(candidate),
    // Region-specific
    ...(region === REGION.MALAYSIA
      ? [checkVlnReceived(candidate), checkPlksReceived(candidate)]
      : [checkVisaStamped(candidate)])
  ];
}

function fmtDate(d) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString(); } catch { return null; }
}

// ─── Individual checks ───────────────────────────────────────────────────────

function checkPassportValid(passport, now) {
  const expiry = passport?.expiryDate ? new Date(passport.expiryDate) : null;
  const passed = !!expiry && (expiry - now) >= SIX_MONTHS_MS;
  return {
    id: 'passport_valid',
    label: 'Passport valid (6+ months remaining)',
    passed,
    detail: expiry ? `Expires ${fmtDate(expiry)}` : 'Passport not linked or expiry date missing'
  };
}

function checkDemandLetterValid(demand, now) {
  const expiry = demand?.demandLetterExpiryDate ? new Date(demand.demandLetterExpiryDate) : null;
  const passed = !!expiry && expiry > now;
  return {
    id: 'demand_letter_valid',
    label: 'Demand letter not expired',
    passed,
    detail: expiry ? `Expires ${fmtDate(expiry)}` : 'No demand letter or expiry date missing'
  };
}

function checkDocumentsComplete(candidate) {
  const checklist = candidate?.documentChecklist;
  let total = 0;
  let done = 0;
  if (checklist) {
    if (checklist instanceof Map) {
      total = checklist.size;
      for (const v of checklist.values()) if (v) done += 1;
    } else if (typeof checklist === 'object') {
      const entries = Object.entries(checklist);
      total = entries.length;
      done = entries.filter(([, v]) => !!v).length;
    }
  }
  const passed = total > 0 && done === total;
  return {
    id: 'documents_complete',
    label: 'All required documents collected',
    passed,
    detail: total > 0 ? `${done} / ${total} collected` : 'No document checklist defined'
  };
}

function checkPurbaSwukriti(demand, now) {
  const number = demand?.purbaSwukritiNumber || null;
  const expiry = demand?.purbaSwukritiExpiryDate ? new Date(demand.purbaSwukritiExpiryDate) : null;
  const passed = !!number && (!expiry || expiry > now);
  return {
    id: 'purba_swukriti_valid',
    label: 'Purba Swukriti issued and within validity',
    passed,
    detail: number
      ? `No. ${number}${expiry ? `, expires ${fmtDate(expiry)}` : ''}`
      : 'Purba Swukriti number not recorded'
  };
}

function checkFeimsRegistered(candidate) {
  const number = candidate?.feimsRegistrationNumber || null;
  return {
    id: 'feims_registered',
    label: 'FEIMS registration number on file',
    passed: !!number,
    detail: number ? `Reg. No. ${number}` : 'Not yet registered in FEIMS'
  };
}

function checkMedicalFit(medical) {
  const passed = medical?.result === 'fit';
  return {
    id: 'medical_fit',
    label: 'Medical fitness certificate',
    passed,
    detail: medical
      ? `Result: ${medical.result}${medical.medicalCenter ? `, Center: ${medical.medicalCenter}` : ''}`
      : 'No medical record found'
  };
}

function checkMedicalNotExpired(medical, now) {
  const conducted = medical?.conductedDate ? new Date(medical.conductedDate) : null;
  const fit = medical?.result === 'fit';
  const passed = fit && !!conducted && (now - conducted) < SIX_MONTHS_MS;
  return {
    id: 'medical_not_expired',
    label: 'Medical report within validity window',
    passed,
    detail: conducted ? `Conducted ${fmtDate(conducted)}` : 'Conducted date not recorded'
  };
}

function checkOrientationComplete(orientation) {
  const passed = orientation?.completionStatus === 'completed';
  return {
    id: 'orientation_complete',
    label: 'Pre-departure orientation completed',
    passed,
    detail: orientation
      ? `Status: ${orientation.completionStatus}${orientation.certificateNumber ? `, Cert. ${orientation.certificateNumber}` : ''}`
      : 'No orientation record found'
  };
}

function checkInsurancePaid(insurance) {
  const passed = !!(insurance?.insurancePaidDate && insurance?.insurancePolicyNumber);
  return {
    id: 'insurance_paid',
    label: 'Foreign employment insurance paid',
    passed,
    detail: insurance?.insurancePolicyNumber
      ? `Policy No. ${insurance.insurancePolicyNumber}`
      : 'Insurance not recorded'
  };
}

function checkSsfPaid(insurance) {
  const passed = !!(insurance?.ssfPaidDate && insurance?.ssfRegistrationNumber);
  return {
    id: 'ssf_paid',
    label: 'SSF contribution paid',
    passed,
    detail: insurance?.ssfRegistrationNumber
      ? `SSF No. ${insurance.ssfRegistrationNumber}`
      : 'SSF not recorded'
  };
}

function checkWelfarePaid(insurance) {
  const passed = insurance?.welfareFundPaid === true;
  return {
    id: 'welfare_paid',
    label: 'Welfare fund paid',
    passed,
    detail: insurance?.welfareFundReceiptNumber
      ? `Receipt ${insurance.welfareFundReceiptNumber}`
      : 'Welfare fund not recorded'
  };
}

function checkShramIssued(candidate) {
  const number = candidate?.shramSwikritiNumber || null;
  const issued = candidate?.shramIssuedDate || null;
  return {
    id: 'shram_issued',
    label: 'Shram Swukriti issued by DoFE',
    passed: !!number,
    detail: number
      ? `Shram No. ${number}${issued ? `, issued ${fmtDate(issued)}` : ''}`
      : 'Shram Swukriti not yet issued'
  };
}

function checkVisaStamped(candidate) {
  const passed = !!(candidate?.visaFileUrl && candidate?.visaNumber);
  return {
    id: 'visa_stamped',
    label: 'Visa stamped by destination embassy',
    passed,
    detail: candidate?.visaNumber
      ? `Visa No. ${candidate.visaNumber}${candidate.visaExpiryDate ? `, expires ${fmtDate(candidate.visaExpiryDate)}` : ''}`
      : 'Visa not recorded'
  };
}

function checkVlnReceived(candidate) {
  const number = candidate?.vlnNumber || candidate?.fwcmsCallingLetterNumber || null;
  return {
    id: 'vln_received',
    label: 'VLN / VDR calling letter received',
    passed: !!number,
    detail: number ? `VLN No. ${number}` : 'VLN / VDR not yet received'
  };
}

function checkPlksReceived(candidate) {
  const number = candidate?.plksNumber || candidate?.eStickerNumber || null;
  return {
    id: 'plks_received',
    label: 'PLKS e-sticker received',
    passed: !!number,
    detail: number ? `PLKS No. ${number}` : 'PLKS not yet received'
  };
}
