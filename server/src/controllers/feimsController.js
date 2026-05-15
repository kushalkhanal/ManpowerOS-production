/**
 * feimsController.js
 *
 * HTTP handlers for the FEIMS / pipeline endpoints.
 * All business logic is delegated to the service layer.
 *
 * Routes:
 *   GET  /feims/checklist/:candidateId       — submission progress checklist
 *   GET  /feims/packet/:candidateId           — full FEIMS form assistant data
 *   GET  /feims/candidate-status/:candidateId — pipeline step tracker
 *   GET  /feims/departure-gate/:candidateId   — departure readiness gate
 *   PATCH /feims/:candidateId/registration    — record FEIMS reg number
 *   PATCH /feims/:candidateId/shram           — record Shram Swukriti number
 */

import asyncHandler from '../utils/asyncHandler.js';
import * as apiResponse from '../utils/apiResponse.js';
import { getFeimsChecklist, getFeimsPacket, getFeimsQueue } from '../services/pipeline/feims.service.js';
import { evaluateDepartureGate } from '../services/pipeline/departureGate.service.js';
import { computeAndSavePipelineStatus } from '../services/pipeline/candidatePipeline.service.js';
import Candidate from '../models/Candidate.js';
import { PIPELINE_STAGES, STAGE_FOR_STATUS } from '../constants/workflow.js';

// ─── GET /feims/queue ────────────────────────────────────────────────────────

const getQueue = asyncHandler(async (req, res) => {
  const agencyId = req.user.agencyId;
  const result = await getFeimsQueue(agencyId);
  return apiResponse.success(res, result);
});

// ─── GET /feims/checklist/:candidateId ────────────────────────────────────────

const getChecklist = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const agencyId = req.user.agencyId;

  const result = await getFeimsChecklist(candidateId, agencyId);
  if (!result) return apiResponse.notFound(res, 'Candidate not found');

  return apiResponse.success(res, result);
});

// ─── GET /feims/packet/:candidateId ──────────────────────────────────────────

const getPacket = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const agencyId = req.user.agencyId;

  const result = await getFeimsPacket(candidateId, agencyId);
  if (!result) return apiResponse.notFound(res, 'Candidate not found');

  return apiResponse.success(res, result);
});

// ─── GET /feims/candidate-status/:candidateId ────────────────────────────────

const getCandidatePipelineStatus = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const agencyId = req.user.agencyId;

  const candidate = await Candidate.findOne({ _id: candidateId, agencyId }).lean();
  if (!candidate) return apiResponse.notFound(res, 'Candidate not found');

  const currentStage = STAGE_FOR_STATUS[candidate.status] || 'registration';

  const stages = PIPELINE_STAGES.map(stage => ({
    id: stage.id,
    label: stage.label,
    order: stage.order,
    statuses: stage.statuses,
    isCurrentStage: stage.id === currentStage,
    isComplete: stage.order < PIPELINE_STAGES.find(s => s.id === currentStage)?.order,
    currentStatus: stage.id === currentStage ? candidate.status : null
  }));

  const currentStageOrder = PIPELINE_STAGES.find(s => s.id === currentStage)?.order ?? 0;
  const totalStages = PIPELINE_STAGES.length;
  const progress = Math.round((currentStageOrder / (totalStages - 1)) * 100);

  return apiResponse.success(res, {
    candidateId: candidate._id,
    candidateName: candidate.fullName,
    currentStatus: candidate.status,
    currentStage,
    progress,
    stages
  });
});

// ─── GET /feims/departure-gate/:candidateId ───────────────────────────────────

const getDepartureGate = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const agencyId = req.user.agencyId;

  const result = await evaluateDepartureGate(candidateId, agencyId);
  if (!result) return apiResponse.notFound(res, 'Candidate not found');

  return apiResponse.success(res, result);
});

// ─── PATCH /feims/:candidateId/registration ───────────────────────────────────

const updateFeimsRegistration = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const agencyId = req.user.agencyId;
  const { feimsRegistrationNumber, feimsSubmittedAt, feimsApprovalStatus, dofeFileNumber } = req.body;

  const update = {};
  if (feimsRegistrationNumber !== undefined) update.feimsRegistrationNumber = feimsRegistrationNumber;
  if (feimsSubmittedAt !== undefined) update.feimsSubmittedAt = feimsSubmittedAt;
  if (feimsApprovalStatus !== undefined) update.feimsApprovalStatus = feimsApprovalStatus;
  if (dofeFileNumber !== undefined) update.dofeFileNumber = dofeFileNumber;

  const candidate = await Candidate.findOneAndUpdate(
    { _id: candidateId, agencyId },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!candidate) return apiResponse.notFound(res, 'Candidate not found');

  const newStatus = await computeAndSavePipelineStatus(candidateId);

  return apiResponse.success(res, { candidate, status: newStatus }, 'FEIMS registration updated');
});

// ─── PATCH /feims/:candidateId/shram ─────────────────────────────────────────

const updateShramSwukriti = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const agencyId = req.user.agencyId;
  const { shramSwikritiNumber, shramIssuedDate, shramExpiryDate } = req.body;

  const update = {};
  if (shramSwikritiNumber !== undefined) update.shramSwikritiNumber = shramSwikritiNumber;
  if (shramIssuedDate !== undefined) update.shramIssuedDate = shramIssuedDate;
  if (shramExpiryDate !== undefined) update.shramExpiryDate = shramExpiryDate;

  const candidate = await Candidate.findOneAndUpdate(
    { _id: candidateId, agencyId },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!candidate) return apiResponse.notFound(res, 'Candidate not found');

  const newStatus = await computeAndSavePipelineStatus(candidateId);

  return apiResponse.success(res, { candidate, status: newStatus }, 'Shram Swukriti updated');
});

export default {
  getQueue,
  getChecklist,
  getPacket,
  getCandidatePipelineStatus,
  getDepartureGate,
  updateFeimsRegistration,
  updateShramSwukriti
};
