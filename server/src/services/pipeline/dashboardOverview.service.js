/**
 * dashboardOverview.service.js
 *
 * Three parallel queries that power the ops dashboard:
 *   1. Pipeline funnel — candidate count grouped by stage (aggregation, no joins)
 *   2. Departure board — candidates in final pre-departure stages
 *   3. Blocked board  — candidates stuck in a blocking status
 *
 * All queries are scoped to agencyId. No cross-model joins on the funnel
 * query keeps it fast even on large datasets.
 */

import mongoose from 'mongoose';
import Candidate from '../../models/Candidate.js';
import { STAGE_DEFINITIONS, BLOCKING_STATUSES } from '../../domain/workflow/index.js';

const DEPARTURE_STAGES = [
  'feims_registered',
  'shram_applied',
  'shram_issued',
  'flight_booked',
  'airport_slot_assigned'
];

const TERMINAL = ['departed', 'returned', 'cancelled'];

const BLOCKING_ARRAY = Array.from(BLOCKING_STATUSES).filter(s => s !== 'cancelled');

export async function getDashboardOverview(agencyId) {
  const agencyObjId = new mongoose.Types.ObjectId(agencyId);

  const [statusAgg, departureBoard, blocked, feimsReadyCount] = await Promise.all([
    Candidate.aggregate([
      { $match: { agencyId: agencyObjId, status: { $nin: TERMINAL } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Candidate.find({ agencyId, status: { $in: DEPARTURE_STAGES } })
      .sort({ updatedAt: -1 })
      .select('fullName status departureDate feimsRegistrationNumber shramSwikritiNumber updatedAt demandId')
      .populate('demandId', 'employerCountry employerCompanyName')
      .lean(),
    Candidate.find({ agencyId, status: { $in: BLOCKING_ARRAY } })
      .sort({ updatedAt: 1 })
      .select('fullName status updatedAt')
      .lean(),
    Candidate.countDocuments({ agencyId, status: 'feims_pending' })
  ]);

  const countByStatus = Object.fromEntries(statusAgg.map(r => [r._id, r.count]));
  const activeTotal = Object.values(countByStatus).reduce((a, b) => a + b, 0);

  const funnel = STAGE_DEFINITIONS
    .filter(s => s.id !== 'post_departure')
    .map(s => ({
      id: s.id,
      label: s.label,
      count: s.statuses.reduce((sum, st) => sum + (countByStatus[st] || 0), 0)
    }))
    .filter(s => s.count > 0);

  return {
    activeTotal,
    feimsReadyCount,
    departingCount: departureBoard.length,
    blockedCount: blocked.length,
    funnel,
    departureBoard: departureBoard.map(c => ({
      _id: c._id,
      fullName: c.fullName,
      status: c.status,
      country: c.demandId?.employerCountry || null,
      company: c.demandId?.employerCompanyName || null,
      feimsRegistrationNumber: c.feimsRegistrationNumber || null,
      shramSwikritiNumber: c.shramSwikritiNumber || null,
      departureDate: c.departureDate || null,
      updatedAt: c.updatedAt
    })),
    blocked: blocked.map(c => ({
      _id: c._id,
      fullName: c.fullName,
      status: c.status,
      stuckSince: c.updatedAt
    }))
  };
}
