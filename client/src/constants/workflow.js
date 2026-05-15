/**
 * workflow.js (client legacy compat layer)
 *
 * The canonical workflow definitions now live in `client/src/domain/workflow`.
 * This file re-exports the same shapes that the rest of the UI has historically
 * imported, so existing components keep working without changes.
 *
 * NEW components should import directly from '../domain/workflow' instead.
 */

import {
  STAGE_DEFINITIONS,
  ALL_STATUSES,
  SPECIAL_STATUSES as DOMAIN_SPECIAL_STATUSES,
  STAGE_FOR_STATUS as DOMAIN_STAGE_FOR_STATUS,
  STAGE_COLORS as DOMAIN_STAGE_COLORS,
  STATUS_LABELS as DOMAIN_STATUS_LABELS,
  STATUS_COLORS as DOMAIN_STATUS_COLORS
} from '../domain/workflow/index.js';

// PIPELINE_STAGES kept in legacy shape so existing UI code keeps working.
export const PIPELINE_STAGES = STAGE_DEFINITIONS.map((stage, idx) => ({
  id: stage.id,
  order: idx,
  label: stage.label,
  icon: stage.icon,
  color: stage.color,
  statuses: stage.statuses
}));

export const SPECIAL_STATUSES = [...DOMAIN_SPECIAL_STATUSES];
export const CANDIDATE_STATUSES = [...ALL_STATUSES];
export const STATUS_LABELS = { ...DOMAIN_STATUS_LABELS };
export const STATUS_COLORS = { ...DOMAIN_STATUS_COLORS };
export const STAGE_COLORS = { ...DOMAIN_STAGE_COLORS };
export const STAGE_FOR_STATUS = { ...DOMAIN_STAGE_FOR_STATUS };
