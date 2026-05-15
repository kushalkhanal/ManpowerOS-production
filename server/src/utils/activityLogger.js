import CandidateActivityLog from '../models/CandidateActivityLog.js';

export const logActivity = async ({
  candidateId,
  agencyId,
  userId,
  userName,
  columnId,
  action,
  details,
  previousValue,
  newValue,
  fileUrl,
  fileName,
  referenceId,
  referenceModel
}) => {
  try {
    await CandidateActivityLog.create({
      candidateId,
      agencyId,
      performedBy: userId,
      performerName: userName,
      columnId,
      action,
      details,
      previousValue,
      newValue,
      fileUrl,
      fileName,
      referenceId,
      referenceModel
    });
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

export default { logActivity };