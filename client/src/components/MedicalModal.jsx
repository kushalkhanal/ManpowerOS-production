import { useState, useEffect } from 'react';
import { useMedical } from '../hooks/useMedical';
import { isValidFileSize, isValidFileType } from '../utils/validation';

const MedicalModal = ({ isOpen, onClose, medical, candidateId, onSuccess }) => {
  const { updateMedical, createMedical, loading } = useMedical();
  const [formData, setFormData] = useState({
    medicalCenter: '',
    amount: '',
    conductedDate: '',
    fit: 'yes',
    examinedBy: '',
  });
  const [reportFile, setReportFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
  const maxFileSize = 10 * 1024 * 1024;

  const resolveFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_SERVER_URL || ''}${url}`;
  };

  const getReadableError = (err) => {
    const apiMessage = err?.response?.data?.message;
    const apiErrors = err?.response?.data?.errors;

    if (Array.isArray(apiErrors) && apiErrors.length > 0) {
      const first = apiErrors[0];
      if (first?.field && first?.message) return `${first.field}: ${first.message}`;
      if (first?.message) return first.message;
    }

    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
    if (err?.message?.includes('Network Error')) {
      return 'Cannot reach server. Please check your internet/server and try again.';
    }
    return 'Unable to save medical record. Please check the form fields and try again.';
  };

  useEffect(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (isOpen && medical) {
      setFormData({
        medicalCenter: medical.medicalCenter || '',
        amount: medical.amount != null ? String(medical.amount) : '',
        conductedDate: medical.conductedDate ? medical.conductedDate.split('T')[0] : '',
        fit: medical.result === 'unfit' ? 'no' : medical.result === 'fit' ? 'yes' : 'yes',
        examinedBy: medical.examinedBy || '',
      });
    } else if (isOpen) {
      setFormData({
        medicalCenter: '',
        amount: '',
        conductedDate: '',
        fit: 'yes',
        examinedBy: '',
      });
    }
    setReportFile(null);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, medical]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'reportFile' && files?.length) {
      const selectedFile = files[0];
      if (!isValidFileType(selectedFile, allowedFileTypes)) {
        setErrors(prev => ({ ...prev, reportFile: 'Only JPG, PNG, WEBP, and PDF are allowed' }));
        return;
      }
      if (!isValidFileSize(selectedFile, maxFileSize)) {
        setErrors(prev => ({ ...prev, reportFile: 'File must be 10MB or smaller' }));
        return;
      }
      setReportFile(selectedFile);
      setErrors(prev => ({ ...prev, reportFile: '' }));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (selectedFile.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!formData.medicalCenter.trim()) {
      nextErrors.medicalCenter = 'Institute Name is required';
    }
    if (!formData.conductedDate) {
      nextErrors.conductedDate = 'Check Up Date is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    try {
      const dataToSend = {
        medicalCenter: formData.medicalCenter,
        amount: formData.amount !== '' ? Number(formData.amount) : undefined,
        conductedDate: formData.conductedDate,
        result: formData.fit === 'yes' ? 'fit' : 'unfit',
        examinedBy: formData.examinedBy,
        candidateId,
        reportFile,
      };

      if (medical?._id) {
        await updateMedical(medical._id, dataToSend);
      } else {
        await createMedical(dataToSend);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ submit: getReadableError(err) });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {medical ? 'Update Medical Details' : 'Add Medical Details'}
                </h3>

                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{errors.submit}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Medical Check-Up Information */}
                  <div className="border-b border-gray-100 pb-1 mb-2">
                    <h4 className="text-sm font-semibold text-primary-600">Medical Check-Up Information</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Institute Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="medicalCenter"
                      value={formData.medicalCenter}
                      onChange={handleChange}
                      placeholder="Enter medical institute name"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.medicalCenter && <p className="text-red-500 text-xs mt-1">{errors.medicalCenter}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="Enter amount"
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Check Up Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="conductedDate"
                      value={formData.conductedDate}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.conductedDate && <p className="text-red-500 text-xs mt-1">{errors.conductedDate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fit</label>
                    <select
                      name="fit"
                      value={formData.fit}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Examined By</label>
                    <input
                      type="text"
                      name="examinedBy"
                      value={formData.examinedBy}
                      onChange={handleChange}
                      placeholder="Enter examiner's name"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Documents */}
                  <div className="border-b border-gray-100 pb-1 mb-2 mt-4">
                    <h4 className="text-sm font-semibold text-primary-600">Documents</h4>
                  </div>

                  <div>
                    {medical?.reportFileUrl && !reportFile && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs text-green-700 font-medium flex-1 truncate">
                          {medical.reportFileUrl.split('/').pop()}
                        </span>
                        <a
                          href={resolveFileUrl(medical.reportFileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-700 underline hover:text-green-900 flex-shrink-0"
                        >
                          View
                        </a>
                      </div>
                    )}
                    <input
                      type="file"
                      name="reportFile"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {errors.reportFile && <p className="text-red-500 text-xs mt-1">{errors.reportFile}</p>}
                    {reportFile && (
                      <div className="mt-2">
                        {previewUrl ? (
                          <div className="relative inline-block">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="h-24 w-24 object-cover rounded-md border border-gray-200 shadow-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-[6rem]">{reportFile.name}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200 w-fit">
                            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-gray-600 max-w-[10rem] truncate">{reportFile.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Allowed: PDF, JPG, PNG, WEBP (max 10MB)</p>
                  </div>
                </form>

                <p className="text-xs text-gray-500 mt-3">
                  <span className="text-red-500">*</span> Required fields
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalModal;
