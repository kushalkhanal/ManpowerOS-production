import Passport from "../models/Passport.js";
import PassportLog from "../models/PassportLog.js";
import {
  deleteCloudinaryFile,
  getPublicIdFromUrl,
} from "../middleware/upload.js";
import logger from "../config/logger.js";

const RETENTION_DAYS = 7;
const RUN_INTERVAL_MS = 60 * 60 * 1000; // every hour

async function runCleanup() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  let passports;
  try {
    // Bypass the pre-find soft-delete middleware by querying isDeleted explicitly
    passports = await Passport.find({
      isDeleted: true,
      deletedAt: { $lte: cutoff },
    })
      .select("_id scannedImageUrl agencyId")
      .lean();
  } catch (err) {
    logger.error(
      "[passportCleanupJob] Failed to query expired soft-deletes",
      err,
    );
    return;
  }

  if (!passports.length) return;

  logger.info(
    `[passportCleanupJob] Purging ${passports.length} passport(s) past ${RETENTION_DAYS}-day window`,
  );

  for (const passport of passports) {
    try {
      // Hard-delete passport and its audit logs together
      await Promise.all([
        Passport.deleteOne({ _id: passport._id, isDeleted: true }),
        PassportLog.deleteMany({ passportId: passport._id }),
      ]);

      // Cloudinary cleanup — non-fatal if it fails
      if (passport.scannedImageUrl) {
        const publicId = getPublicIdFromUrl(passport.scannedImageUrl);
        if (publicId) {
          await deleteCloudinaryFile(publicId).catch((err) =>
            logger.warn(
              `[passportCleanupJob] Cloudinary delete failed for ${publicId}`,
              err,
            ),
          );
        }
      }
    } catch (err) {
      logger.error(
        `[passportCleanupJob] Failed to purge passport ${passport._id}`,
        err,
      );
    }
  }
}

export function startPassportCleanupJob() {
  // Run once immediately on startup, then on the interval
  runCleanup();
  setInterval(runCleanup, RUN_INTERVAL_MS);
  logger.info(
    `[passportCleanupJob] Started — purges soft-deleted passports older than ${RETENTION_DAYS} days (runs every hour)`,
  );
}
