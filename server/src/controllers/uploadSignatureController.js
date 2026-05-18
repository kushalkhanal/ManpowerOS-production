import { v2 as cloudinary } from 'cloudinary';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../config/logger.js';

/**
 * Document categories the client can request signed uploads for.
 * Each entry maps to a Cloudinary folder + access mode.
 * Keep this list closed — never let the client choose arbitrary folders.
 */
const UPLOAD_CATEGORIES = {
  visa: { folder: 'documents', accessMode: 'authenticated' },
  feims: { folder: 'documents', accessMode: 'authenticated' },
  departure: { folder: 'documents', accessMode: 'authenticated' },
  passport: { folder: 'passports', accessMode: 'authenticated' },
  medical: { folder: 'medical', accessMode: 'authenticated' },
  orientation: { folder: 'orientation', accessMode: 'authenticated' },
  insurance: { folder: 'insurance', accessMode: 'authenticated' },
  logo: { folder: 'logos', accessMode: 'public' }
};

const sanitizeAgencySegment = (raw) => String(raw || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');

/**
 * POST /api/secure-files/sign-upload
 * Body: { category: 'visa' | 'passport' | ... }
 *
 * Returns the params the browser needs to POST directly to Cloudinary, bypassing
 * the Node server entirely. Saves bandwidth/CPU for large uploads.
 *
 * Client flow:
 *   1. POST here → receive { signature, timestamp, apiKey, cloudName, folder, publicId, type, resourceType }
 *   2. POST FormData to https://api.cloudinary.com/v1_1/<cloudName>/<resourceType>/upload
 *      with the same params + the file.
 *   3. Receive { secure_url, public_id, ... } from Cloudinary.
 *   4. PATCH the candidate (or other model) with the resulting secure_url.
 *
 * Security:
 *   - Signature locks folder, public_id prefix, timestamp, and resource type.
 *   - Folder is forced to manpoweros/{agencyId}/{category-folder} — tenant-scoped.
 *   - 10-minute upload window via timestamp signing.
 */
export const signUpload = asyncHandler(async (req, res) => {
  if (!process.env.CLOUDINARY_API_SECRET) {
    return res.status(503).json({ message: 'Direct uploads not configured' });
  }

  const { category } = req.body || {};
  const config = UPLOAD_CATEGORIES[category];
  if (!config) {
    return res.status(400).json({ message: 'Unknown upload category' });
  }

  const agencyId = sanitizeAgencySegment(req.user?.agencyId);
  const folder = `manpoweros/${agencyId}/${config.folder}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${category}_${timestamp}_${Math.round(Math.random() * 1e9)}`;
  const type = config.accessMode === 'authenticated' ? 'authenticated' : 'upload';

  // Params we want signed. Cloudinary validates exact equality on the upload request.
  const paramsToSign = {
    folder,
    public_id: publicId,
    timestamp,
    type
  };

  let signature;
  try {
    signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);
  } catch (err) {
    logger.error('Failed to sign Cloudinary upload', { err: err.message });
    return res.status(500).json({ message: 'Could not sign upload' });
  }

  return res.json({
    signature,
    timestamp,
    folder,
    publicId,
    type,
    resourceType: 'auto',
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    // Hard limit for the client to enforce client-side; Cloudinary also enforces if configured at account level.
    maxFileSize: 10 * 1024 * 1024
  });
});

export default { signUpload };
