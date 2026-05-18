import CandidateActivityLog from "../models/CandidateActivityLog.js";
import logger from "../config/logger.js";

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
  referenceModel,
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
      referenceModel,
    });
  } catch (error) {
    logger.error("Activity logging error", {
      error: error.message,
      candidateId,
      action,
    });
  }
};

export default { logActivity };
