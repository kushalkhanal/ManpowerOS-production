import { v2 as cloudinary } from 'cloudinary';
import logger from '../config/logger.js';

const SIGNED_URL_TTL_SECONDS = 5 * 60;

const isCloudinaryUrl = (url) => typeof url === 'string' && url.includes('res.cloudinary.com');

/**
 * Parse a Cloudinary delivery URL into its components.
 * Returns { resourceType, deliveryType, version, publicId, format, isAuthenticated } or null.
 *
 * Pattern: https://res.cloudinary.com/<cloud>/<resource_type>/<delivery_type>/[v<version>/]<public_id>.<ext>
 *   resource_type: image | raw | video
 *   delivery_type: upload | authenticated | private
 */
export const parseCloudinaryUrl = (url) => {
  if (!isCloudinaryUrl(url)) return null;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const cloudIdx = segments.findIndex((s) => s === 'image' || s === 'raw' || s === 'video');
    if (cloudIdx === -1 || segments.length < cloudIdx + 3) return null;

    const resourceType = segments[cloudIdx];
    const deliveryType = segments[cloudIdx + 1];
    const rest = segments.slice(cloudIdx + 2);

    const versioned = /^v\d+$/.test(rest[0]);
    const version = versioned ? rest[0].slice(1) : null;
    const publicIdParts = versioned ? rest.slice(1) : rest;
    if (publicIdParts.length === 0) return null;

    const lastIdx = publicIdParts.length - 1;
    const last = publicIdParts[lastIdx];
    const dot = last.lastIndexOf('.');
    const format = dot !== -1 ? last.slice(dot + 1) : null;
    publicIdParts[lastIdx] = dot !== -1 ? last.slice(0, dot) : last;

    return {
      resourceType,
      deliveryType,
      version,
      publicId: publicIdParts.join('/'),
      format,
      isAuthenticated: deliveryType === 'authenticated' || deliveryType === 'private'
    };
  } catch (err) {
    logger.debug('parseCloudinaryUrl failed', { url, err: err.message });
    return null;
  }
};

/**
 * Extract the agency segment from a manpoweros-namespaced Cloudinary URL.
 * Returns the agencyId or null. Used to enforce tenant isolation on signed-URL access.
 */
export const extractAgencyFromCloudinaryUrl = (url) => {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return null;
  const match = parsed.publicId.match(/^manpoweros\/([^/]+)\//);
  return match ? match[1] : null;
};

/**
 * Generate a short-lived signed URL for a Cloudinary asset.
 * Works for both `authenticated` (delivers private resource) and `upload` (public)
 * resources — for public resources it returns the original URL since signing isn't needed.
 *
 * Returns { url, expiresAt } or null if the asset can't be signed.
 */
export const buildSignedDocumentUrl = (rawUrl, { ttlSeconds = SIGNED_URL_TTL_SECONDS } = {}) => {
  const parsed = parseCloudinaryUrl(rawUrl);
  if (!parsed) return null;

  if (!parsed.isAuthenticated) {
    return { url: rawUrl, expiresAt: null };
  }

  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  try {
    const url = cloudinary.utils.private_download_url(parsed.publicId, parsed.format, {
      resource_type: parsed.resourceType,
      type: parsed.deliveryType,
      expires_at: expiresAt,
      attachment: false
    });
    return { url, expiresAt: expiresAt * 1000 };
  } catch (err) {
    logger.error('buildSignedDocumentUrl failed', { rawUrl, err: err.message });
    return null;
  }
};

export default { parseCloudinaryUrl, extractAgencyFromCloudinaryUrl, buildSignedDocumentUrl };
