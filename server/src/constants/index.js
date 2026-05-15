/**
 * server/src/constants/index.js
 *
 * Single source of truth for all domain constants on the server side.
 * Keep this in sync with client/src/utils/constants.js.
 */

// ─── Plans ───────────────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  trial: {
    name: 'Trial',
    candidates: 20,
    users: 1,
    price: 0,
    trialDays: 14,
    description: '14-day free trial'
  },
  basic: {
    name: 'Basic',
    candidates: 200,
    users: 5,
    price: 2000,
    description: 'NPR 2,000/month'
  },
  pro: {
    name: 'Pro',
    candidates: null,   // unlimited
    users: null,        // unlimited
    price: 5000,
    description: 'NPR 5,000/month'
  }
};

// ─── Staff / Roles ────────────────────────────────────────────────────────────

export const STAFF_ROLES = [
  'admin', 'manager', 'documentation', 'accounts', 'agent'
];

// ─── Candidate Statuses (sourced from workflow.js) ───────────────────────────

export { CANDIDATE_STATUSES } from './workflow.js';

// ─── Destination Countries ────────────────────────────────────────────────────

export const DESTINATION_COUNTRIES = [
  'Qatar', 'Saudi Arabia', 'UAE', 'Kuwait', 'Malaysia',
  'Bahrain', 'Oman', 'South Korea', 'Japan', 'Israel',
  'Poland', 'Romania', 'Croatia', 'Other'
];

// ─── Medical Types ────────────────────────────────────────────────────────────

export const MEDICAL_TYPES = {
  gamca: ['Qatar', 'Saudi Arabia', 'Kuwait', 'Bahrain', 'Oman'],
  wafid: ['UAE'],
  other: ['Malaysia', 'South Korea', 'Japan', 'Israel', 'Poland', 'Romania', 'Croatia', 'Other']
};

/**
 * Auto-select medical type based on destination country.
 * @param {string} country
 * @returns {'gamca' | 'wafid' | 'other'}
 */
export const getMedicalType = (country) => {
  for (const [type, countries] of Object.entries(MEDICAL_TYPES)) {
    if (countries.includes(country)) return type;
  }
  return 'other';
};

// ─── Government Fees (NPR) ────────────────────────────────────────────────────

export const GOVERNMENT_FEES = {
  PDOT_ORIENTATION: 700,
  FOREIGN_EMPLOYMENT_INSURANCE: 1674,
  SSF_CONTRIBUTION: 2595,
  WELFARE_FUND: 100
};

// ─── Education Levels ─────────────────────────────────────────────────────────

export const EDUCATION_LEVELS = [
  'illiterate', 'primary', 'slc', 'plus2', 'bachelor', 'master'
];

// ─── Passport Custody Statuses ────────────────────────────────────────────────

export const PASSPORT_CUSTODY_STATUSES = [
  'with_agency', 'returned_to_candidate', 'submitted_embassy', 'lost'
];

export const PASSPORT_ALLOCATION_STATUSES = [
  'in_pool', 'allocated', 'departed', 'returned'
];

// ─── Alert Types ──────────────────────────────────────────────────────────────

export const ALERT_TYPES = [
  'passport_expiring',
  'medical_expiring',
  'demand_expiring',
  'swukriti_expiring',
  'medical_failed',
  'process_stalled',
  'fee_outstanding',
  'orientation_missing',
  'insurance_expiring',
  'dofe_license_expiring'
];
