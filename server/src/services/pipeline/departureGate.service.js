/**
 * departureGate.service.js
 *
 * Thin orchestrator that loads the candidate's snapshot from the database
 * and delegates evaluation to the pure domain function in
 * `domain/workflow/departureGate.js`.
 *
 * No business rules live in this file anymore. All "what makes a candidate
 * ready to depart" logic is in the domain layer, where it can be tested
 * deterministically without hitting the database.
 */

import Candidate from '../../models/Candidate.js';
import Medical from '../../models/Medical.js';
import Orientation from '../../models/Orientation.js';
import InsuranceSsf from '../../models/InsuranceSsf.js';
import Passport from '../../models/Passport.js';
import { evaluateDepartureGateSnapshot } from '../../domain/workflow/index.js';

/**
 * Evaluate departure readiness for a candidate.
 *
 * @param {string|ObjectId} candidateId
 * @param {string|ObjectId} agencyId
 * @returns {Promise<{ready: boolean, blockers: string[], checks: Array, region: string} | null>}
 */
export async function evaluateDepartureGate(candidateId, agencyId) {
  const candidate = await Candidate.findOne({ _id: candidateId, agencyId })
    .populate('demandId')
    .lean();

  if (!candidate) return null;

  const [medical, orientation, insurance, passport] = await Promise.all([
    Medical.findOne({ candidateId, agencyId }).sort({ createdAt: -1 }).lean(),
    Orientation.findOne({ candidateId, agencyId }).sort({ createdAt: -1 }).lean(),
    InsuranceSsf.findOne({ candidateId, agencyId }).sort({ createdAt: -1 }).lean(),
    Passport.findOne({ candidateId, agencyId }).lean()
  ]);

  return evaluateDepartureGateSnapshot({
    candidate,
    medical,
    orientation,
    insurance,
    passport,
    demand: candidate.demandId // already populated above
  });
}

/**
 * Thin wrapper for use in status-transition guards.
 */
export async function canDepart(candidateId, agencyId) {
  const result = await evaluateDepartureGate(candidateId, agencyId);
  return result?.ready ?? false;
}
