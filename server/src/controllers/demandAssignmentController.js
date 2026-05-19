import mongoose from 'mongoose';
import DemandAssignment from '../models/DemandAssignment.js';
import JobDemand from '../models/JobDemand.js';
import Candidate from '../models/Candidate.js';
import Passport from '../models/Passport.js';
import asyncHandler from '../utils/asyncHandler.js';
import { scopeFilter, scopeData } from '../utils/tenantHelper.js';

// POST /api/demands/:id/assign  { candidateId, notes? }
export const assignCandidateToDemand = asyncHandler(async (req, res) => {
  const { id: demandId } = req.params;
  const { candidateId, notes } = req.body;

  if (!candidateId) {
    return res.status(400).json({ message: 'candidateId is required' });
  }

  const demand = await JobDemand.findOne(
    scopeFilter(req, { _id: demandId })
  );
  if (!demand) {
    return res.status(404).json({ message: 'Demand not found' });
  }
  if (demand.status !== 'active') {
    return res
      .status(400)
      .json({ message: `Demand is ${demand.status}; cannot assign` });
  }
  if (demand.filledPositions >= demand.totalPositions) {
    return res
      .status(400)
      .json({ message: 'Demand has no remaining positions' });
  }

  const candidate = await Candidate.findOne(
    scopeFilter(req, { _id: candidateId })
  );
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  // Block if candidate is already actively assigned somewhere.
  const existingActive = await DemandAssignment.findOne(
    scopeFilter(req, { candidateId, status: 'assigned' })
  );
  if (existingActive) {
    return res.status(409).json({
      message: 'Candidate is already assigned to an active demand',
      existingAssignment: existingActive
    });
  }

  const session = await mongoose.startSession();
  let assignment;
  try {
    try {
      await session.withTransaction(async () => {
        assignment = (
          await DemandAssignment.create(
            [
              scopeData(req, {
                demandId,
                candidateId,
                status: 'assigned',
                assignedAt: new Date(),
                assignedBy: req.user.userId,
                notes
              })
            ],
            { session }
          )
        )[0];

        await JobDemand.updateOne(
          { _id: demandId },
          { $inc: { filledPositions: 1 } },
          { session }
        );

        await Passport.updateOne(
          { _id: candidate.passportId },
          {
            $set: {
              allocationStatus: 'allocated',
              allocatedToDemandId: demandId,
              allocatedAt: new Date(),
              allocatedBy: req.user.userId
            }
          },
          { session }
        );

        await Candidate.updateOne(
          { _id: candidateId },
          {
            $set: {
              desiredCountry: demand.employerCountry,
              desiredJobCategory: demand.jobCategory,
              status: 'demand_allocated'
            }
          },
          { session }
        );
      });
    } catch (err) {
      if (
        err?.message?.includes(
          'Transaction numbers are only allowed on a replica set'
        )
      ) {
        // Fallback path (non-transactional). Best-effort.
        assignment = await DemandAssignment.create(
          scopeData(req, {
            demandId,
            candidateId,
            status: 'assigned',
            assignedAt: new Date(),
            assignedBy: req.user.userId,
            notes
          })
        );
        await JobDemand.updateOne(
          { _id: demandId },
          { $inc: { filledPositions: 1 } }
        );
        await Passport.updateOne(
          { _id: candidate.passportId },
          {
            $set: {
              allocationStatus: 'allocated',
              allocatedToDemandId: demandId,
              allocatedAt: new Date(),
              allocatedBy: req.user.userId
            }
          }
        );
        await Candidate.updateOne(
          { _id: candidateId },
          {
            $set: {
              desiredCountry: demand.employerCountry,
              desiredJobCategory: demand.jobCategory,
              status: 'demand_allocated'
            }
          }
        );
      } else {
        throw err;
      }
    }
  } finally {
    await session.endSession();
  }

  res.status(201).json({ assignment });
});

// POST /api/demands/:id/withdraw/:candidateId  { reason? }
export const withdrawCandidateFromDemand = asyncHandler(async (req, res) => {
  const { id: demandId, candidateId } = req.params;
  const { reason } = req.body;

  const assignment = await DemandAssignment.findOne(
    scopeFilter(req, { demandId, candidateId, status: 'assigned' })
  );
  if (!assignment) {
    return res
      .status(404)
      .json({ message: 'Active assignment not found' });
  }

  const candidate = await Candidate.findOne(
    scopeFilter(req, { _id: candidateId })
  );

  const session = await mongoose.startSession();
  try {
    const runWithdraw = async (s) => {
      const opts = s ? { session: s } : {};
      await DemandAssignment.updateOne(
        { _id: assignment._id },
        {
          $set: {
            status: 'withdrawn',
            withdrawnAt: new Date(),
            withdrawnReason: reason
          }
        },
        opts
      );
      await JobDemand.updateOne(
        { _id: demandId },
        { $inc: { filledPositions: -1 } },
        opts
      );
      if (candidate?.passportId) {
        await Passport.updateOne(
          { _id: candidate.passportId },
          {
            $set: {
              allocationStatus: 'in_pool',
              allocatedToDemandId: null,
              allocatedAt: null,
              allocatedBy: null
            }
          },
          opts
        );
      }
      await Candidate.updateOne(
        { _id: candidateId },
        {
          $set: {
            status: 'cancelled',
            cancellationReason: reason || 'Withdrawn from demand'
          }
        },
        opts
      );
    };

    try {
      await session.withTransaction(() => runWithdraw(session));
    } catch (err) {
      if (
        err?.message?.includes(
          'Transaction numbers are only allowed on a replica set'
        )
      ) {
        await runWithdraw(null);
      } else {
        throw err;
      }
    }
  } finally {
    await session.endSession();
  }

  res.status(200).json({ success: true });
});

// GET /api/demands/:id/assignments
export const listDemandAssignments = asyncHandler(async (req, res) => {
  const { id: demandId } = req.params;
  const { status } = req.query;
  const filter = scopeFilter(req, { demandId });
  if (status) filter.status = status;

  const assignments = await DemandAssignment.find(filter)
    .populate({
      path: 'candidateId',
      select: 'phone status passportId desiredCountry',
      populate: {
        path: 'passportId',
        select: 'fullName fullNameNepali passportNumber gender dateOfBirth'
      }
    })
    .sort({ assignedAt: -1 })
    .lean();

  res.status(200).json({ data: assignments });
});
