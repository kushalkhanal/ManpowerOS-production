export const hasFile = (data) =>
  data != null &&
  typeof data === 'object' &&
  Object.values(data).some((v) => v instanceof File || v instanceof Blob);

/**
 * Convert a plain object to FormData, skipping null/undefined values.
 * File/Blob instances are appended directly; everything else is stringified
 * only if it's an object, otherwise appended as-is.
 *
 * @param {Record<string, unknown>} data
 * @param {(key: string) => boolean} [skipEmpty] - optional predicate to also skip empty strings
 */
export const toFormData = (data, skipEmpty = false) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (skipEmpty && value === '') return;
    if (value instanceof File || value instanceof Blob) {
      fd.append(key, value);
    } else if (typeof value === 'object') {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, value);
    }
  });
  return fd;
};
