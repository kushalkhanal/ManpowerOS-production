import DepartedRecord from '../models/DepartedRecord.js';
import logger from '../config/logger.js';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Move DepartedRecords older than 1 year to archived state.
 * Designed to be called by a cron job or admin endpoint.
 * Returns the count of records archived.
 */
export const archiveOldDepartedRecords = async (agencyId = null) => {
  const cutoff = new Date(Date.now() - ONE_YEAR_MS);

  const filter = {
    isArchived: false,
    departedAt: { $lt: cutoff },
  };
  if (agencyId) filter.agencyId = agencyId;

  const result = await DepartedRecord.updateMany(filter, {
    $set: { isArchived: true, archivedAt: new Date() },
  });

  logger.info(`[archive] Archived ${result.modifiedCount} departed records${agencyId ? ` for agency ${agencyId}` : ''}`);
  return result.modifiedCount;
};

/**
 * Get archive stats — how many records are hot vs archived per agency.
 */
export const getArchiveStats = async (agencyId) => {
  const [hot, archived] = await Promise.all([
    DepartedRecord.countDocuments({ agencyId, isArchived: false }),
    DepartedRecord.countDocuments({ agencyId, isArchived: true }),
  ]);
  return { hot, archived, total: hot + archived };
};
