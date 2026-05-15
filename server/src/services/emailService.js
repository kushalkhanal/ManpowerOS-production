import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

let transporter = null;

const isConfigured = () =>
  !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const FROM = () =>
  `"${process.env.SMTP_FROM_NAME || 'ManpowerOS'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;

// ─── Internal send helper ─────────────────────────────────────────────────────

const send = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  if (!t) {
    logger.debug('emailService: SMTP not configured, skipping email', { to, subject });
    return;
  }
  try {
    await t.sendMail({ from: FROM(), to, subject, html, text });
    logger.info('emailService: sent', { to, subject });
  } catch (err) {
    logger.error('emailService: send failed', { to, subject, error: err.message });
  }
};

// ─── Candidate stage change ───────────────────────────────────────────────────

export const sendStageChangeEmail = async ({ candidateName, newStatus, agentEmail, agentName }) => {
  if (!agentEmail) return;

  await send({
    to: agentEmail,
    subject: `Candidate Update — ${candidateName}`,
    text: `Hi ${agentName || 'there'},\n\n${candidateName}'s status has been updated to: ${newStatus}.\n\nLog in to ManpowerOS to review.`,
    html: `
      <p>Hi ${agentName || 'there'},</p>
      <p><strong>${candidateName}</strong>'s status has been updated to: <strong>${newStatus}</strong>.</p>
      <p>Log in to ManpowerOS to review the candidate's pipeline.</p>
      <hr/>
      <p style="color:#888;font-size:12px">ManpowerOS — Manpower Agency Management</p>
    `,
  });
};

// ─── Staff invite ─────────────────────────────────────────────────────────────

export const sendInviteEmail = async ({ recipientEmail, recipientName, inviteLink, agencyName }) => {
  await send({
    to: recipientEmail,
    subject: `You've been invited to join ${agencyName} on ManpowerOS`,
    text: `Hi ${recipientName},\n\nYou have been invited to join ${agencyName} on ManpowerOS.\n\nAccept your invite: ${inviteLink}\n\nThis link expires in 7 days.`,
    html: `
      <p>Hi ${recipientName},</p>
      <p>You have been invited to join <strong>${agencyName}</strong> on ManpowerOS.</p>
      <p><a href="${inviteLink}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:white;border-radius:6px;text-decoration:none;font-weight:600;">Accept Invite</a></p>
      <p style="color:#888;font-size:12px">This link expires in 7 days. If you didn't expect this email, you can safely ignore it.</p>
    `,
  });
};

// ─── Password reset (future) ──────────────────────────────────────────────────

export const sendPasswordResetEmail = async ({ recipientEmail, recipientName, resetLink }) => {
  await send({
    to: recipientEmail,
    subject: 'Reset your ManpowerOS password',
    text: `Hi ${recipientName},\n\nReset your password: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore it.`,
    html: `
      <p>Hi ${recipientName},</p>
      <p>Someone requested a password reset for your ManpowerOS account.</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:white;border-radius:6px;text-decoration:none;font-weight:600;">Reset Password</a></p>
      <p style="color:#888;font-size:12px">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });
};

export default { sendStageChangeEmail, sendInviteEmail, sendPasswordResetEmail };
