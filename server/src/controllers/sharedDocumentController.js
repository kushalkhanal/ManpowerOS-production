import SharedDocument from '../models/SharedDocument.js';
import Passport from '../models/Passport.js';
import Candidate from '../models/Candidate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activityLogger.js';

export const getSharedDocument = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  
  let query = { agencyId: req.user.agencyId };
  if (entityType === 'candidate') {
    query.candidateId = entityId;
  } else if (entityType === 'passport') {
    query.passportId = entityId;
  } else {
    return res.status(400).json({ message: 'Invalid entityType' });
  }

  let sharedDoc = await SharedDocument.findOne(query);

  if (!sharedDoc) {
    return res.status(200).json({
      documents: {}
    });
  }

  res.status(200).json(sharedDoc);
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { documentType } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/documents/${req.file.filename}`;

  let candidateId = null;
  let passportId = null;

  if (entityType === 'candidate') {
    candidateId = entityId;
    const candidate = await Candidate.findOne({ _id: candidateId, agencyId: req.user.agencyId });
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    if (candidate && candidate.passportId) {
      passportId = candidate.passportId;
    }
  } else if (entityType === 'passport') {
    passportId = entityId;
    const passport = await Passport.findOne({ _id: passportId, agencyId: req.user.agencyId });
    if (!passport) {
      return res.status(404).json({ message: 'Passport not found' });
    }
    if (passport && passport.candidateId) {
      candidateId = passport.candidateId;
    }
  } else {
    return res.status(400).json({ message: 'Invalid entityType' });
  }

  let query = { agencyId: req.user.agencyId };
  if (passportId) {
    query.passportId = passportId;
  } else {
    query.candidateId = candidateId;
  }

  let sharedDoc = await SharedDocument.findOne(query);

  if (!sharedDoc) {
    sharedDoc = new SharedDocument({
      agencyId: req.user.agencyId,
      candidateId: candidateId,
      passportId: passportId
    });
  } else {
    if (candidateId && !sharedDoc.candidateId) sharedDoc.candidateId = candidateId;
    if (passportId && !sharedDoc.passportId) sharedDoc.passportId = passportId;
  }

  sharedDoc[`${documentType}File`] = {
    url: fileUrl,
    uploadedAt: new Date()
  };

  await sharedDoc.save();

  if (candidateId) {
    await logActivity({
      candidateId,
      agencyId: req.user.agencyId,
      userId: req.user.userId,
      userName: req.user.name,
      columnId: 'document',
      action: 'file_uploaded',
      details: `${documentType} document uploaded from ${entityType} page`,
      fileUrl,
      fileName: req.file.originalname,
      referenceId: sharedDoc._id,
      referenceModel: 'SharedDocument'
    });
  }

  res.status(200).json(sharedDoc);
});
