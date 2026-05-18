import { useState, useEffect, useRef } from 'react';
import { sharedDocumentsApi } from '../api';
import { isValidFileSize, isValidFileType } from '../utils/validation';

const DOCUMENT_TYPES = [
  {
    key: 'passport',
    label: 'Passport',
    icon: '🛂',
    accept: 'image/*,application/pdf'
  },
  {
    key: 'medical',
    label: 'Medical',
    icon: '🏥',
    accept: 'image/*,application/pdf'
  },
  {
    key: 'visa',
    label: 'Visa',
    icon: '✈️',
    accept: 'image/*,application/pdf'
  },
  {
    key: 'stamping',
    label: 'Stamping',
    icon: '📋',
    accept: 'image/*,application/pdf'
  },
  {
    key: 'orientation',
    label: 'Orientation',
    icon: '📚',
    accept: 'image/*,application/pdf'
  },
  {
    key: 'photo',
    label: 'Passport Photo',
    icon: '📷',
    accept: 'image/*'
  },
  {
    key: 'mrp',
    label: 'MRP Photo',
    icon: '🆔',
    accept: 'image/*,application/pdf'
  },
  {
    key: 'financial',
    label: 'Financial Doc',
    icon: '💰',
    accept: 'image/*,application/pdf'
  }
];

const BASE_URL = '';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * SharedDocumentsPanel
 *
 * Props:
 *   entityType  - 'passport' | 'candidate'
 *   entityId    - MongoDB ObjectId string of the passport or candidate
 */
const SharedDocumentsPanel = ({ entityType, entityId }) => {
  const [documents, setDocuments] = useState(null);
  const [uploading, setUploading] = useState({}); // { [docKey]: boolean }
  const [errors, setErrors] = useState({});
  const fileInputRefs = useRef({});

  const fetchDocuments = async () => {
    if (!entityType || !entityId) return;
    try {
      const res = await sharedDocumentsApi.getDocuments(entityType, entityId);
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load shared documents:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [entityType, entityId]);

  const handleUpload = async (docType, file) => {
    if (!file) return;

    if (!isValidFileType(file, ALLOWED_TYPES)) {
      setErrors(prev => ({
        ...prev,
        [docType]: 'Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.'
      }));
      return;
    }

    if (!isValidFileSize(file, MAX_FILE_SIZE)) {
      setErrors(prev => ({
        ...prev,
        [docType]: 'File too large. Maximum size is 10 MB.'
      }));
      return;
    }

    setUploading(prev => ({ ...prev, [docType]: true }));
    setErrors(prev => ({ ...prev, [docType]: null }));
    try {
      const res = await sharedDocumentsApi.uploadDocument(entityType, entityId, docType, file);
      setDocuments(res.data);
    } catch (err) {
      console.error(`Failed to upload ${docType}:`, err);
      const serverErrors = err.response?.data?.errors;
      const messageFromErrors = Array.isArray(serverErrors) && serverErrors.length > 0
        ? serverErrors.map(e => e.message).join(' ')
        : null;
      setErrors(prev => ({
        ...prev,
        [docType]: messageFromErrors || err.response?.data?.message || 'Upload failed'
      }));
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleFileChange = (docType, e) => {
    const file = e.target.files[0];
    if (file) handleUpload(docType, file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const getDocUrl = (docType) => {
    const fileKey = `${docType}File`;
    const fileObj = documents?.[fileKey];
    if (!fileObj?.url) return null;
    const url = fileObj.url;
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        <span className="text-xs bg-primary-50 text-primary-600 font-medium px-2 py-0.5 rounded-full border border-primary-100">
          Shared
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DOCUMENT_TYPES.map(({ key, label, icon, accept }) => {
          const docUrl = getDocUrl(key);
          const isUploading = uploading[key];
          const error = errors[key];
          const uploadedAt = documents?.[`${key}File`]?.uploadedAt;
          const isPdf = docUrl?.toLowerCase().endsWith('.pdf');

          return (
            <div
              key={key}
              className={`relative rounded-xl border-2 flex flex-col items-center justify-between p-3 transition-all min-h-[140px] ${
                docUrl
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-dashed border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-white'
              }`}
            >
              {/* Icon + Label */}
              <div className="flex flex-col items-center gap-1 w-full">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-semibold text-gray-700 text-center">{label}</span>
              </div>

              {/* Preview / Status */}
              <div className="w-full flex flex-col items-center gap-1 my-2">
                {docUrl ? (
                  isPdf ? (
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 underline"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM7 13h10v1.5H7V13zm0 3h7v1.5H7V16z"/>
                      </svg>
                      View PDF
                    </a>
                  ) : (
                    <a href={docUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={docUrl}
                        alt={label}
                        className="w-full h-14 object-cover rounded-md border border-primary-100"
                      />
                    </a>
                  )
                ) : (
                  <span className="text-[10px] text-gray-400 text-center">No file yet</span>
                )}
                {uploadedAt && (
                  <span className="text-[10px] text-gray-400">{formatDate(uploadedAt)}</span>
                )}
              </div>

              {/* Upload Button */}
              <div className="w-full">
                <input
                  ref={el => (fileInputRefs.current[key] = el)}
                  type="file"
                  accept={accept}
                  className="hidden"
                  id={`upload-${entityType}-${entityId}-${key}`}
                  onChange={(e) => handleFileChange(key, e)}
                />
                <label
                  htmlFor={`upload-${entityType}-${entityId}-${key}`}
                  className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isUploading
                      ? 'bg-gray-200 text-gray-400 cursor-wait'
                      : docUrl
                      ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Uploading…
                    </>
                  ) : docUrl ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Replace
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload
                    </>
                  )}
                </label>
                {error && (
                  <p className="text-[10px] text-red-500 mt-1 text-center">{error}</p>
                )}
              </div>

              {/* Uploaded Badge */}
              {docUrl && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400" title="Document uploaded" />
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-gray-400">
        Documents are shared — uploading from either the Passport or Candidate page updates the same record.
        Supported formats: JPG, PNG, PDF, WebP · Max 10 MB
      </p>
    </div>
  );
};

export default SharedDocumentsPanel;
