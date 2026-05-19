/**
 * File storage tiering.
 *
 * Hot tier  — Cloudinary (recent files, < FILE_COLD_TIER_DAYS old)
 * Cold tier — Backblaze B2 (older files, cheaper per-GB storage)
 *
 * Migration flow (run as a background job):
 *   1. Call listColdCandidates() to find Cloudinary URLs older than the threshold.
 *   2. Download from Cloudinary, upload to B2 via S3-compatible API.
 *   3. Update the model's fileUrl field with the B2 URL.
 *   4. Delete the Cloudinary asset.
 *
 * This module only handles URL routing and tier decisions.
 * Actual upload/download is handled by the caller using the AWS SDK (S3-compat).
 */
import { config } from '../config/env.js';

const COLD_TIER_MS = config.fileColdTierDays * 24 * 60 * 60 * 1000;

/** Returns 'hot' (Cloudinary) or 'cold' (B2) based on upload age. */
export const getStorageTier = (uploadedAt) => {
  if (!uploadedAt) return 'hot';
  return Date.now() - new Date(uploadedAt).getTime() > COLD_TIER_MS ? 'cold' : 'hot';
};

/** Returns true if B2 cold storage is fully configured. */
export const isColdStorageConfigured = () => config.b2.configured;

/**
 * Build the public URL for a B2 file.
 * Uses the S3-compatible endpoint: {endpoint}/{bucketName}/{key}
 */
export const buildB2Url = (key) => {
  if (!config.b2.endpoint || !config.b2.bucketName) {
    throw new Error('B2 not configured — set B2_ENDPOINT and B2_BUCKET_NAME');
  }
  return `${config.b2.endpoint}/${config.b2.bucketName}/${key}`;
};

/**
 * Derive the B2 object key from a Cloudinary URL.
 * Extracts the path after /upload/ and uses it as the B2 key.
 * e.g. https://res.cloudinary.com/demo/image/upload/v1/manpoweros/agencyId/passport.jpg
 *   → manpoweros/agencyId/passport.jpg
 */
export const cloudinaryUrlToB2Key = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;
  const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return match ? match[1] : null;
};

/**
 * Returns S3-compatible client config for B2.
 * Caller is responsible for importing @aws-sdk/client-s3.
 */
export const getB2ClientConfig = () => ({
  endpoint: config.b2.endpoint,
  region: 'us-east-1', // B2 ignores region but AWS SDK requires it
  credentials: {
    accessKeyId: config.b2.keyId,
    secretAccessKey: config.b2.key,
  },
  forcePathStyle: true, // required for B2
});
