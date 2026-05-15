import asyncHandler from '../utils/asyncHandler.js';
import * as apiResponse from '../utils/apiResponse.js';
import { getGulfVisaBoard, getMalaysiaPlksBoard } from '../services/pipeline/countryModules.service.js';
import Candidate from '../models/Candidate.js';
import { computeAndSavePipelineStatus } from '../services/pipeline/candidatePipeline.service.js';

// ── GET boards ────────────────────────────────────────────────────────────────

const getGulfVisa = asyncHandler(async (req, res) => {
  const result = await getGulfVisaBoard(req.user.agencyId);
  return apiResponse.success(res, result);
});

const getMalaysiaPlks = asyncHandler(async (req, res) => {
  const result = await getMalaysiaPlksBoard(req.user.agencyId);
  return apiResponse.success(res, result);
});

// ── PATCH gulf visa ───────────────────────────────────────────────────────────

const updateGulfVisa = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const { visaNumber, visaReceivedDate, visaExpiryDate } = req.body;

  const update = {};
  if (visaNumber       !== undefined) update.visaNumber       = visaNumber;
  if (visaReceivedDate !== undefined) update.visaReceivedDate = visaReceivedDate;
  if (visaExpiryDate   !== undefined) update.visaExpiryDate   = visaExpiryDate;

  const candidate = await Candidate.findOneAndUpdate(
    { _id: candidateId, agencyId: req.user.agencyId },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!candidate) return apiResponse.notFound(res, 'Candidate not found');

  const newStatus = await computeAndSavePipelineStatus(candidateId);
  return apiResponse.success(res, { candidate, status: newStatus }, 'Visa details updated');
});

// ── PATCH malaysia VLN / PLKS ─────────────────────────────────────────────────

const updateMalaysiaPlks = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const {
    vlnNumber, vlnReceivedDate, vlnExpiryDate,
    fwcmsCallingLetterNumber, fwcmsReceivedDate,
    fomemaReferenceNumber, bestinetBiometricRef,
    plksNumber, plksIssuedDate, plksExpiryDate
  } = req.body;

  const update = {};
  if (vlnNumber                !== undefined) update.vlnNumber                = vlnNumber;
  if (vlnReceivedDate          !== undefined) update.vlnReceivedDate          = vlnReceivedDate;
  if (vlnExpiryDate            !== undefined) update.vlnExpiryDate            = vlnExpiryDate;
  if (fwcmsCallingLetterNumber !== undefined) update.fwcmsCallingLetterNumber = fwcmsCallingLetterNumber;
  if (fwcmsReceivedDate        !== undefined) update.fwcmsReceivedDate        = fwcmsReceivedDate;
  if (fomemaReferenceNumber    !== undefined) update.fomemaReferenceNumber    = fomemaReferenceNumber;
  if (bestinetBiometricRef     !== undefined) update.bestinetBiometricRef     = bestinetBiometricRef;
  if (plksNumber               !== undefined) update.plksNumber               = plksNumber;
  if (plksIssuedDate           !== undefined) update.plksIssuedDate           = plksIssuedDate;
  if (plksExpiryDate           !== undefined) update.plksExpiryDate           = plksExpiryDate;

  const candidate = await Candidate.findOneAndUpdate(
    { _id: candidateId, agencyId: req.user.agencyId },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!candidate) return apiResponse.notFound(res, 'Candidate not found');

  const newStatus = await computeAndSavePipelineStatus(candidateId);
  return apiResponse.success(res, { candidate, status: newStatus }, 'VLN / PLKS details updated');
});

export default { getGulfVisa, getMalaysiaPlks, updateGulfVisa, updateMalaysiaPlks };
