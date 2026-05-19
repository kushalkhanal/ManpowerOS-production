/**
 * candidatePipeline.service.js
 *
 * Computes a candidate's current pipeline status by inspecting the candidate
 * document and all related sub-documents. This is the single authoritative
 * source for status derivation — controllers and cron jobs should call this
 * rather than computing status ad-hoc.
 *
 * Design:
 *  - Pure business logic; no HTTP concerns.
 *  - Always re-fetches sub-documents so the result reflects database truth.
 *  - Terminal statuses (departed, returned, cancelled) are preserved as-is.
 */

import Candidate from '../../models/Candidate.js';
import Medical from '../../models/Medical.js';
import Orientation from '../../models/Orientation.js';
import InsuranceSsf from '../../models/InsuranceSsf.js';
import JobDemand from '../../models/JobDemand.js';
import User from '../../models/User.js';
import { TERMINAL_STATUSES, BLOCKING_STATUSES } from '../../constants/workflow.js';
import { sendStageChangeEmail } from '../emailService.js';
import logger from '../../config/logger.js';

/**
 * Derives the correct pipeline status for a candidate based on current data.
 *
 * The function walks the pipeline from bottom to top and returns the earliest
 * incomplete step. Order of precedence matches the official DoFE workflow.
 *
 * @param {string|ObjectId} candidateId
 * @returns {Promise<string>} The computed status string.
 */
export async function computePipelineStatus(candidateId) {
  const candidate = await Candidate.findById(candidateId).lean();
  if (!candidate) return null;

  // ── Terminal / special states are preserved ───────────────────────────────
  if (TERMINAL_STATUSES.has(candidate.status)) return candidate.status;
  if (candidate.status === 'on_hold') return 'on_hold';

  // ── Stage 10: Post-departure ──────────────────────────────────────────────
  if (candidate.departedAt) return 'departed';

  // ── Stage 0: Registration ─────────────────────────────────────────────────
  if (!candidate.demandId) return 'registered';

  // ── Stage 1: Demand matching ──────────────────────────────────────────────
  const [medical, orientation, insurance, demand] = await Promise.all([
    Medical.findOne({ candidateId, agencyId: candidate.agencyId }).sort({ createdAt: -1 }).lean(),
    Orientation.findOne({ candidateId, agencyId: candidate.agencyId }).sort({ createdAt: -1 }).lean(),
    InsuranceSsf.findOne({ candidateId, agencyId: candidate.agencyId }).sort({ createdAt: -1 }).lean(),
    JobDemand.findById(candidate.demandId).lean()
  ]);

  // ── Stage 2: Documentation ────────────────────────────────────────────────
  const hasPassport = !!(candidate.passportId || candidate.passportNumber);
  if (!hasPassport) return 'demand_allocated';

  // ── Stage 3: FEIMS pre-registration ───────────────────────────────────────
  if (!candidate.feimsRegistrationNumber) return 'feims_pending';
  if (candidate.feimsApprovalStatus === 'pending' && candidate.feimsSubmittedAt) return 'feims_submitted';

  // ── Stage 4: Medical ──────────────────────────────────────────────────────
  if (!medical) return 'medical_scheduled';
  if (medical.result === 'unfit') return 'medical_failed';

  if (medical.result === 'on_hold') return 'medical_on_hold';

  if (medical.result === 'pending') {
    return medical.scheduledDate ? 'medical_scheduled' : 'feims_registered';
  }

  // medical.result === 'fit' — check expiry (6-month validity)
  if (medical.result === 'fit') {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const reportDate = medical.conductedDate || medical.updatedAt;
    if (reportDate && new Date(reportDate) < sixMonthsAgo) return 'medical_expired';
  }

  // ── Stage 5: Orientation ──────────────────────────────────────────────────
  if (!orientation) return 'orientation_scheduled';
  if (orientation.completionStatus === 'absent') return 'orientation_absent';
  if (orientation.completionStatus !== 'completed') return 'orientation_scheduled';

  // ── Stage 6: Government compliance ───────────────────────────────────────
  const insurancePaid = !!(insurance?.insurancePaidDate && insurance?.insurancePolicyNumber);
  const ssfPaid = !!(insurance?.ssfPaidDate && insurance?.ssfRegistrationNumber);
  const welfarePaid = insurance?.welfareFundPaid === true;

  if (!insurancePaid) return 'compliance_pending';
  if (!ssfPaid) return 'insurance_done';
  if (!welfarePaid) return 'ssf_done';

  // ── Stage 7: Visa & Embassy ───────────────────────────────────────────────
  if (!candidate.visaNumber) return 'visa_applied';
  if (!candidate.visaFileUrl) return 'visa_applied';

  // ── Stage 8: Shram Swukriti ───────────────────────────────────────────────
  if (!candidate.shramSwikritiNumber) return 'shram_applied';

  // ── Stage 9: Departure prep ───────────────────────────────────────────────
  if (!candidate.flightDate) return 'shram_issued';

  return 'flight_booked';
}

/**
 * Computes and persists the pipeline status to the database.
 *
 * @param {string|ObjectId} candidateId
 * @returns {Promise<string>} The new status.
 */
export async function computeAndSavePipelineStatus(candidateId) {
  const newStatus = await computePipelineStatus(candidateId);
  if (!newStatus) return newStatus;

  const candidate = await Candidate.findById(candidateId).select('status fullName agentId').lean();
  const oldStatus = candidate?.status;

  await Candidate.findByIdAndUpdate(candidateId, { status: newStatus });

  if (candidate && oldStatus !== newStatus && candidate.agentId) {
    User.findById(candidate.agentId).select('name email').lean()
      .then(agent => {
        if (agent?.email) {
          sendStageChangeEmail({
            candidateName: candidate.fullName,
            newStatus,
            agentEmail: agent.email,
            agentName: agent.name,
          });
        }
      })
      .catch((err) => logger.warn('[pipeline] Stage-change email failed', { candidateId, error: err.message }));
  }

  return newStatus;
}

/**
 * Recomputes and saves statuses for every candidate in an agency.
 * Used by admin/cron to resync statuses after bulk data changes.
 *
 * @param {string|ObjectId} agencyId
 * @returns {Promise<Array<{candidateId, oldStatus, newStatus}>>}
 */
export async function recomputeAgencyStatuses(agencyId) {
  const candidates = await Candidate.find({ agencyId }, '_id status').lean();
  const changed = [];

  for (const c of candidates) {
    if (TERMINAL_STATUSES.has(c.status)) continue;
    const newStatus = await computePipelineStatus(c._id);
    if (newStatus && newStatus !== c.status) {
      await Candidate.findByIdAndUpdate(c._id, { status: newStatus });
      changed.push({ candidateId: c._id, oldStatus: c.status, newStatus });
    }
  }

  return changed;
}
