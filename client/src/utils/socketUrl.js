export const resolveSocketServerUrl = (configuredUrl, fallbackOrigin) => {
  const normalized = typeof configuredUrl === 'string' ? configuredUrl.trim() : '';
  if (!normalized) {
    return fallbackOrigin;
  }

  // Prevent accidental placeholder values from breaking production sockets.
  if (normalized.includes('your-render-backend.onrender.com')) {
    return fallbackOrigin;
  }

  return normalized;
};

export default resolveSocketServerUrl;
