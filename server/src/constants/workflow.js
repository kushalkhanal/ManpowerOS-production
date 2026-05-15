/**
 * workflow.js (legacy compat layer)
 *
 * The canonical workflow definitions now live in `server/src/domain/workflow`.
 * This file re-exports the same shapes that the rest of the codebase has
 * historically imported, so existing controllers/services keep working
 * without changes.
 *
 * NEW code should import directly from '../domain/workflow' instead.
 */

import {
  STAGE_DEFINITIONS,
  ALL_STATUSES,
  SPECIAL_STATUSES as DOMAIN_SPECIAL_STATUSES,
  STAGE_FOR_STATUS as DOMAIN_STAGE_FOR_STATUS,
  STAGE_ORDER as DOMAIN_STAGE_ORDER,
  TERMINAL_STATUSES as DOMAIN_TERMINAL_STATUSES,
  BLOCKING_STATUSES as DOMAIN_BLOCKING_STATUSES,
  getDepartureGateRequirements,
  getFeimsRequiredFields
} from '../domain/workflow/index.js';

// PIPELINE_STAGES kept in legacy shape — { id, order, label, statuses }.
export const PIPELINE_STAGES = STAGE_DEFINITIONS.map((stage, idx) => ({
  id: stage.id,
  order: idx,
  label: stage.label,
  statuses: stage.statuses
}));

export const SPECIAL_STATUSES = [...DOMAIN_SPECIAL_STATUSES];

export const CANDIDATE_STATUSES = [...ALL_STATUSES];

export const STAGE_FOR_STATUS = { ...DOMAIN_STAGE_FOR_STATUS };

export const STAGE_ORDER = { ...DOMAIN_STAGE_ORDER };

export const TERMINAL_STATUSES = new Set(DOMAIN_TERMINAL_STATUSES);

export const BLOCKING_STATUSES = new Set(DOMAIN_BLOCKING_STATUSES);

// Legacy: country-blind departure-gate requirements. New code should call
// getDepartureGateRequirements(country) for region-aware results.
export const DEPARTURE_GATE_REQUIREMENTS = getDepartureGateRequirements(null);

// Legacy: country-blind FEIMS required fields. New code should call
// getFeimsRequiredFields(country) for region-aware results.
export const FEIMS_REQUIRED_FIELDS = getFeimsRequiredFields(null);
