import api from '../api/axios.js';

/**
 * Direct-to-Cloudinary upload.
 *
 * Avoids streaming bytes through our Node server. Used for large docs or to
 * reduce backend load.
 *
 *   const { secureUrl, publicId } = await directUpload(file, 'visa', (pct) => setProgress(pct));
 *   await candidatesApi.update(id, { visaFileUrl: secureUrl });
 *
 * @param {File} file
 * @param {'visa'|'feims'|'departure'|'passport'|'medical'|'orientation'|'insurance'|'logo'} category
 * @param {(pct:number) => void} [onProgress] - 0..100
 * @returns {Promise<{ secureUrl: string, publicId: string }>}
 */
export const directUpload = async (file, category, onProgress) => {
  if (!file) throw new Error('directUpload: file is required');

  const { data: sig } = await api.post('/secure-files/sign-upload', { category });

  if (file.size > sig.maxFileSize) {
    throw new Error(`File exceeds ${(sig.maxFileSize / 1024 / 1024).toFixed(0)}MB limit`);
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  form.append('public_id', sig.publicId);
  form.append('type', sig.type);

  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.open('POST', sig.uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText);
          resolve({ secureUrl: parsed.secure_url, publicId: parsed.public_id });
        } catch (err) {
          reject(new Error('Invalid Cloudinary response'));
        }
      } else {
        let msg = `Cloudinary upload failed (${xhr.status})`;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed?.error?.message) msg = parsed.error.message;
        } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Network error uploading to Cloudinary'));
    xhr.send(form);
  });
};

export default directUpload;
