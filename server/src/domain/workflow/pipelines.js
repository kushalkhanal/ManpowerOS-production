/**
 * Pipelines — region-specific stage sequences.
 *
 * The Gulf and Malaysia pipelines diverge mainly in:
 *   - Medical system    (Gulf: GAMCA/Wafid;  Malaysia: FOMEMA/Bestinet)
 *   - Visa flow         (Gulf: calling visa + embassy stamping;
 *                        Malaysia: VLN/VDR + PLKS e-sticker)
 *   - Embassy handoff   (Gulf only)
 *
 * Pure domain module — no Mongoose, no Express, no I/O.
 */

import { REGION, getRegionForCountry } from './countries.js';
import {
  STAGE,
  STAGE_DEFINITIONS,
  getStageDefinition
} from './stages.js';

// ─── Per-region stage sequences ──────────────────────────────────────────────

const GULF_STAGE_IDS = [
  STAGE.REGISTRATION,
  STAGE.DEMAND_MATCHING,
  STAGE.TRADE_TEST,
  STAGE.DOCUMENTATION,
  STAGE.MEDICAL,
  STAGE.CALLING_VISA,
  STAGE.COMPLIANCE,
  STAGE.ORIENTATION,
  STAGE.PURBA_SWUKRITI,
  STAGE.VISA_STAMPING,
  STAGE.FEIMS_SUBMISSION,
  STAGE.SHRAM_SWUKRITI,
  STAGE.DEPARTURE_PREP,
  STAGE.POST_DEPARTURE
];

const MALAYSIA_STAGE_IDS = [
  STAGE.REGISTRATION,
  STAGE.DEMAND_MATCHING,
  STAGE.TRADE_TEST,
  STAGE.DOCUMENTATION,
  STAGE.MEDICAL,
  STAGE.CALLING_VISA,
  STAGE.COMPLIANCE,
  STAGE.ORIENTATION,
  STAGE.PURBA_SWUKRITI,
  STAGE.PLKS,
  STAGE.FEIMS_SUBMISSION,
  STAGE.SHRAM_SWUKRITI,
  STAGE.DEPARTURE_PREP,
  STAGE.POST_DEPARTURE
];

function buildPipeline(stageIds, order) {
  return Object.freeze({
    region: order,
    stages: Object.freeze(
      stageIds
        .map((id, idx) => {
          const def = getStageDefinition(id);
          if (!def) return null;
          return Object.freeze({
            ...def,
            order: idx
          });
        })
        .filter(Boolean)
    )
  });
}

export const PIPELINES = Object.freeze({
  [REGION.GULF]: buildPipeline(GULF_STAGE_IDS, REGION.GULF),
  [REGION.MALAYSIA]: buildPipeline(MALAYSIA_STAGE_IDS, REGION.MALAYSIA)
});

// ─── Public API ──────────────────────────────────────────────────────────────

export function getPipelineForRegion(region) {
  return PIPELINES[region] || null;
}

export function getPipelineForCountry(country) {
  const region = getRegionForCountry(country);
  return getPipelineForRegion(region);
}

/**
 * Default fallback pipeline used when a candidate has no destination set yet
 * or when the destination is outside v1 scope. Falls back to Gulf since it is
 * the larger destination corridor.
 */
export function getDefaultPipeline() {
  return PIPELINES[REGION.GULF];
}

export function listPipelineStages(country) {
  const pipeline = getPipelineForCountry(country) || getDefaultPipeline();
  return pipeline.stages;
}

// ─── Departure-gate requirements (region-aware) ──────────────────────────────

const COMMON_GATE = [
  { id: 'passport_valid',         label: 'Passport valid (6+ months remaining)' },
  { id: 'demand_letter_valid',    label: 'Demand letter not expired' },
  { id: 'documents_complete',     label: 'All required documents collected' },
  { id: 'medical_fit',            label: 'Medical fitness certificate' },
  { id: 'medical_not_expired',    label: 'Medical report within validity window' },
  { id: 'orientation_complete',   label: 'Pre-departure orientation completed' },
  { id: 'insurance_paid',         label: 'Foreign employment insurance paid' },
  { id: 'ssf_paid',               label: 'SSF contribution paid' },
  { id: 'welfare_paid',           label: 'Welfare fund paid' },
  { id: 'purba_swukriti_valid',   label: 'Purba Swukriti issued and within validity' },
  { id: 'feims_registered',       label: 'FEIMS registration number on file' },
  { id: 'shram_issued',           label: 'Shram Swukriti issued by DoFE' }
];

const GULF_GATE_EXTRAS = [
  { id: 'visa_stamped',           label: 'Visa stamped by destination embassy' }
];

const MALAYSIA_GATE_EXTRAS = [
  { id: 'vln_received',           label: 'VLN / VDR calling letter received' },
  { id: 'plks_received',          label: 'PLKS e-sticker received' }
];

export function getDepartureGateRequirements(country) {
  const region = getRegionForCountry(country);
  const extras = region === REGION.MALAYSIA ? MALAYSIA_GATE_EXTRAS : GULF_GATE_EXTRAS;
  return [...COMMON_GATE, ...extras].map(req => ({
    ...req,
    blocksDeparture: true
  }));
}

// ─── Region-aware FEIMS required fields ──────────────────────────────────────

const COMMON_FEIMS_FIELDS = [
  { key: 'fullName',              label: 'Full Name (English)' },
  { key: 'dateOfBirth',           label: 'Date of Birth' },
  { key: 'gender',                label: 'Gender' },
  { key: 'nationalIdNumber',      label: 'Citizenship / National ID Number' },
  { key: 'phone',                 label: 'Phone Number' },
  { key: 'permanentDistrict',     label: 'Permanent District' },
  { key: 'permanentMunicipality', label: 'Municipality / VDC' },
  { key: 'permanentWardNo',       label: 'Ward Number' },
  { key: 'passportNumber',        label: 'Passport Number' },
  { key: 'desiredCountry',        label: 'Destination Country' },
  { key: 'desiredJobCategory',    label: 'Job Category' }
];

const GULF_FEIMS_EXTRAS = [
  { key: 'visaNumber',            label: 'Visa Number (post-stamping)' }
];

const MALAYSIA_FEIMS_EXTRAS = [
  { key: 'vlnNumber',             label: 'VLN / VDR Number' },
  { key: 'plksNumber',            label: 'PLKS Number' }
];

export function getFeimsRequiredFields(country) {
  const region = getRegionForCountry(country);
  const extras = region === REGION.MALAYSIA ? MALAYSIA_FEIMS_EXTRAS : GULF_FEIMS_EXTRAS;
  return [...COMMON_FEIMS_FIELDS, ...extras];
}

// ─── Re-export canonical stage list for callers that want everything ─────────

export { STAGE_DEFINITIONS };
