import { useState, useEffect } from 'react';
import { candidatesApi } from '../api';
import { isValidFileSize, isValidFileType } from '../utils/validation';
import { useSecureDocUrl } from '../utils/secureDocUrl';

const CallingVisaModal = ({ isOpen, onClose, candidateId, candidateData, demand, onSuccess }) => {
  const [formData, setFormData] = useState({ visaNumber: '', visaReceivedDate: '' });
  const [visaFile, setVisaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  const maxFileSize = 10 * 1024 * 1024;

  const { url: secureVisaUrl } = useSecureDocUrl(candidateData?.visaFileUrl);

  useEffect(() => {
    if (candidateData) {
      setFormData({
        visaNumber: candidateData.visaNumber || '',
        visaReceivedDate: candidateData.visaReceivedDate ? candidateData.visaReceivedDate.split('T')[0] : ''
      });
    }
    setVisaFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateData, isOpen]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'visaFile' && files?.length) {
      const selected = files[0];
      if (!isValidFileType(selected, allowedFileTypes)) {
        setErrors(prev => ({ ...prev, visaFile: 'Only JPG, PNG, WEBP, and PDF are allowed' }));
        return;
      }
      if (!isValidFileSize(selected, maxFileSize)) {
        setErrors(prev => ({ ...prev, visaFile: 'File must be 10MB or smaller' }));
        return;
      }
      setVisaFile(selected);
      setErrors(prev => ({ ...prev, visaFile: '' }));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setVisaFile(null);
    setErrors(prev => ({ ...prev, visaFile: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.visaNumber?.trim()) {
      setErrors({ visaNumber: 'Please enter the visa number from the demand letter' });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        visaNumber: formData.visaNumber.trim(),
        visaReceivedDate: formData.visaReceivedDate || undefined
      };
      if (visaFile) payload.visaFile = visaFile;

      await candidatesApi.update(candidateId, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const existingFileUrl = candidateData?.visaFileUrl;
  const existingFileName = existingFileUrl ? existingFileUrl.split('/').pop() : null;
  const existingIsImage = existingFileUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(existingFileUrl);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Calling Visa</h3>
            <p className="text-sm text-gray-500 mb-4">Record the visa number received from the employer's demand letter.</p>

            {demand && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
                <p className="font-medium text-blue-800">Demand Letter Details</p>
                <div className="mt-1 space-y-0.5 text-blue-700 text-xs">
                  {demand.employerCompanyName && <p>Company: {demand.employerCompanyName}</p>}
                  {demand.employerCountry && <p>Country: {demand.employerCountry}</p>}
                  {demand.jobCategory && <p>Job: {demand.jobCategory}</p>}
                  {demand.purbaSwikritiNumber && <p>Purba Swikriti No.: {demand.purbaSwikritiNumber}</p>}
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{errors.submit}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Visa Number (from demand letter) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="visaNumber"
                  value={formData.visaNumber}
                  onChange={handleChange}
                  placeholder="e.g., V/2024/001234"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {errors.visaNumber && <p className="text-xs text-red-600 mt-1">{errors.visaNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Calling Visa Received Date</label>
                <input
                  type="date"
                  name="visaReceivedDate"
                  value={formData.visaReceivedDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Visa Document Upload */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Document</label>

                {existingFileUrl && !visaFile && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    {existingIsImage && secureVisaUrl ? (
                      <img
                        src={secureVisaUrl}
                        alt="Visa"
                        className="h-10 w-10 object-cover rounded border border-green-300 flex-shrink-0"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-xs text-green-700 font-medium flex-1 truncate">{existingFileName}</span>
                    {secureVisaUrl && (
                      <a
                        href={secureVisaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-700 underline hover:text-green-900 flex-shrink-0"
                      >
                        View
                      </a>
                    )}
                  </div>
                )}

                <input
                  type="file"
                  name="visaFile"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {errors.visaFile && <p className="text-red-500 text-xs mt-1">{errors.visaFile}</p>}

                {visaFile && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-md border border-gray-200 shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="h-20 w-20 flex items-center justify-center bg-white border border-gray-200 rounded-md flex-shrink-0">
                        <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{visaFile.name}</p>
                      <p className="text-[11px] text-gray-500">{(visaFile.size / 1024).toFixed(1)} KB</p>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="mt-1 text-[11px] text-red-600 hover:text-red-800 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-1">Allowed: PDF, JPG, PNG, WEBP (max 10MB)</p>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-3">
              <span className="text-red-500">*</span> Required fields only. Other fields are optional.
            </p>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallingVisaModal;
