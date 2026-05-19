// Shared formatting utilities — single source of truth for display helpers

const AVATAR_COLORS = [
  'bg-primary', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
];

export function getAvatarColor(name) {
  const hash = name?.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) ?? 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

/** Format date as "12 Jan 2025" */
export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/** Format date as "12 Jan 2025, 03:45 PM" */
export function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Format date as "12 Jan 2025, 03:45 PM" (US locale for activity logs) */
export function fmtDateTimeUS(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Format ISO date string (YYYY-MM-DD) for date inputs */
export function toInputDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

/** Days until a future date (negative = past) */
export function daysUntil(d) {
  return d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;
}

/** "Today" / "Yesterday" / "3d ago" / "2mo ago" */
export function formatRelativeDate(date) {
  if (!date) return 'Never';
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
