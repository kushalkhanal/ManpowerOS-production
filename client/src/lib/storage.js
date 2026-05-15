const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const safeParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

export const getItem = (key) => {
  if (!isBrowser) return null;
  return window.localStorage.getItem(key);
};

export const getJson = (key, fallback = null) => {
  const value = getItem(key);
  return value ? safeParse(value, fallback) : fallback;
};

export const setItem = (key, value) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, value);
};

export const setJson = (key, value) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const removeItem = (key) => {
  if (!isBrowser) return;
  window.localStorage.removeItem(key);
};

export const clearSession = () => {
  removeItem('token');
  removeItem('user');
  removeItem('agency');
  removeItem('admin_token');
};
