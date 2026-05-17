/**
 * Validated client-side env vars (Vite `import.meta.env.VITE_*`).
 *
 * Single source of truth — components must import from here instead of
 * reading `import.meta.env.VITE_*` directly. Keeping zod out of the
 * client bundle for now; switch to zod when forms adopt it in Phase 1.
 */

const raw = import.meta.env;

function readString(key, { required = false, fallback = '' } = {}) {
  const value = raw[key];
  if (value == null || value === '') {
    if (required && raw.PROD) {
      throw new Error(`Missing required env var: ${key}`);
    }
    return fallback;
  }
  return String(value).trim();
}

export const env = Object.freeze({
  serverUrl: readString('VITE_SERVER_URL'),
  whatsappNumber: readString('VITE_WHATSAPP_NUMBER', { fallback: '9779800000000' }),
  isDev: raw.DEV === true,
  isProd: raw.PROD === true,
  mode: raw.MODE,
});

/** Prefix a relative URL with VITE_SERVER_URL when set. */
export function withServerUrl(url) {
  if (!url) return url;
  return `${env.serverUrl}${url}`;
}
