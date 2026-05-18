import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';
import {
  parseCloudinaryUrl,
  extractAgencyFromCloudinaryUrl,
  buildSignedDocumentUrl
} from '../utils/secureDocuments.js';
import { deleteCloudinaryFile } from '../middleware/upload.js';
import logger from '../config/logger.js';

/**
 * GET /api/secure-files/resolve?url=<encoded-document-url>
 *
 * Returns JSON { url, expiresAt } with a viewable URL the client can drop into
 * <img src> or <a href>. The client must fetch this with its auth header — once
 * we hand back the signed URL, it's safe to use anywhere until expiresAt.
 *
 * - Cloudinary `authenticated`/`private` assets → short-lived signed Cloudinary URL.
 * - Cloudinary `upload` (public) assets → original URL passes through (legacy compat).
 * - Local-disk uploads (/uploads/...) → original URL.
 *
 * Tenant check: the user's agencyId must match the agency segment in the
 * Cloudinary folder convention manpoweros/{agencyId}/... — superadmins bypass.
 */
export const resolveDocument = asyncHandler(async (req, res) => {
  const raw = req.query.url;
  if (!raw || typeof raw !== 'string') {
    return res.status(400).json({ message: 'Missing url query parameter' });
  }

  let target;
  try {
    target = new URL(raw, 'http://placeholder');
  } catch {
    return res.status(400).json({ message: 'Invalid url' });
  }

  const isCloudinary = target.hostname.endsWith('res.cloudinary.com');
  const isLocalUpload = raw.startsWith('/uploads/') || target.pathname.startsWith('/uploads/');

  if (!isCloudinary && !isLocalUpload) {
    return res.status(400).json({ message: 'URL not permitted' });
  }

  // Tenant enforcement for Cloudinary URLs — manpoweros/{agencyId}/...
  if (isCloudinary) {
    const fileAgencyId = extractAgencyFromCloudinaryUrl(raw);
    const userAgencyId = req.user?.agencyId?.toString();
    const isSuperadmin = req.user?.role === 'superadmin';

    if (fileAgencyId && !isSuperadmin && fileAgencyId !== userAgencyId) {
      logger.warn('Cross-tenant document access denied', {
        userId: req.user?.userId,
        userAgencyId,
        fileAgencyId
      });
      return res.status(403).json({ message: 'Access denied' });
    }
  }

  // Local-disk fallback (dev).
  if (!isCloudinary) {
    return res.json({ url: raw, expiresAt: null });
  }

  const parsed = parseCloudinaryUrl(raw);
  if (!parsed) {
    return res.status(400).json({ message: 'Unrecognized Cloudinary URL' });
  }

  // Public Cloudinary asset — backward compat for files uploaded before authenticated mode.
  if (!parsed.isAuthenticated) {
    return res.json({ url: raw, expiresAt: null });
  }

  const signed = buildSignedDocumentUrl(raw);
  if (!signed?.url) {
    return res.status(500).json({ message: 'Could not generate signed URL' });
  }

  return res.json({ url: signed.url, expiresAt: signed.expiresAt });
});

/**
 * POST /api/secure-files/moderation-webhook
 *
 * Receives Cloudinary moderation results (MetaScan / WebPurify). When an asset is
 * flagged as rejected, immediately delete it from Cloudinary. Asset URL persisted
 * in our DB will then 404 — preferable to serving malware.
 *
 * NOTE: Cloudinary signs notifications. We verify HMAC-SHA1 of body + timestamp
 * with the API secret before trusting the payload.
 *
 * Configure: in Cloudinary dashboard, set Notification URL to:
 *   https://<your-host>/api/secure-files/moderation-webhook
 * No auth header required — webhook is public but signature-verified.
 */
export const moderationWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) return res.status(503).json({ message: 'Webhook not configured' });

  const signature = req.headers['x-cld-signature'];
  const timestamp = req.headers['x-cld-timestamp'];
  if (!signature || !timestamp) {
    return res.status(400).json({ message: 'Missing signature headers' });
  }

  // Verify signature: SHA1(rawBody + timestamp + secret)
  const rawBody = JSON.stringify(req.body || {});
  const expected = crypto
    .createHash('sha1')
    .update(rawBody + timestamp + secret)
    .digest('hex');
  if (expected !== signature) {
    logger.warn('Cloudinary moderation webhook signature mismatch');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { notification_type, moderation_status, public_id, resource_type } = req.body || {};
  if (notification_type !== 'moderation') {
    return res.status(200).json({ ok: true, ignored: true });
  }

  if (moderation_status === 'rejected') {
    logger.warn('Moderation REJECTED — deleting asset', { public_id, resource_type });
    await deleteCloudinaryFile(public_id);
    // NOTE: the *FileUrl reference in MongoDB will become a 404. A follow-up sweep job
    // could null out the field, but for now leaving it surfaces the issue to ops.
  } else {
    logger.info('Moderation result', { public_id, moderation_status });
  }

  return res.status(200).json({ ok: true });
});

export default { resolveDocument, moderationWebhook };
