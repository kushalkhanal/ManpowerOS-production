/**
 * candidateStatusService.js
 *
 * Backward-compatible shim that re-exports the pipeline service functions
 * under the names that existing controllers already import.
 *
 * All actual logic lives in services/pipeline/candidatePipeline.service.js.
 */

import {
  computePipelineStatus,
  computeAndSavePipelineStatus,
  recomputeAgencyStatuses
} from './pipeline/candidatePipeline.service.js';

export const computeCandidateStatus = computePipelineStatus;
export const computeAndSaveCandidateStatus = computeAndSavePipelineStatus;
export const recomputeAllCandidateStatuses = recomputeAgencyStatuses;

export default {
  computeCandidateStatus,
  computeAndSaveCandidateStatus,
  recomputeAllCandidateStatuses
};
