import { useState, useEffect } from 'react';
import { useMedical } from '../hooks/useMedical';
import { RESULT_COLORS, RESULT_LABELS } from '../utils/medicalConstants';
import { isValidFileSize, isValidFileType } from '../utils/validation';

const MedicalModal = ({ isOpen, onClose, medical, candidateId, onSuccess }) => {
  const { updateMedical, createMedical, loading } = useMedical();
  const [formData, setFormData] = useState({
    result: 'pending',
    conductedDate: '',
    reportNumber: '',
    reportExpiryDate: '',
    unfitReason: '',
    recheckScheduledDate: '',
    notes: '',
    medicalCenter: ''
  });
  const [reportFile, setReportFile] = useState(null);
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
    return 'Unable to save medical record. Please check the form fields and file requirements.';
  };

  useEffect(() => {
    if (isOpen && medical) {
      setFormData({
        result: medical.result || 'pending',
        conductedDate: medical.conductedDate ? medical.conductedDate.split('T')[0] : '',
        reportNumber: medical.reportNumber || '',
        reportExpiryDate: medical.reportExpiryDate ? medical.reportExpiryDate.split('T')[0] : '',
        unfitReason: medical.unfitReason || '',
        recheckScheduledDate: medical.recheckScheduledDate ? medical.recheckScheduledDate.split('T')[0] : '',
        notes: medical.notes || '',
        medicalCenter: medical.medicalCenter || ''
      });
    } else if (isOpen) {
      setFormData({
        result: 'pending',
        conductedDate: '',
        reportNumber: '',
        reportExpiryDate: '',
        unfitReason: '',
        recheckScheduledDate: '',
        notes: '',
        medicalCenter: ''
      });
    }
    setReportFile(null);
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
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (formData.result !== 'pending' && !formData.conductedDate) {
      nextErrors.conductedDate = 'Please fill "Conducted Date" in Medical section';
    }
    if (formData.result === 'unfit' && !formData.unfitReason.trim()) {
      nextErrors.unfitReason = 'Please fill "Unfit Reason" in Medical section';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    try {
      const dataToSend = {
        ...formData,
        candidateId,
        reportFile
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
                  {medical ? 'Update Medical Result' : 'Schedule Medical'}
                </h3>

                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{errors.submit}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Medical Center</label>
                    <input
                      type="text"
                      name="medicalCenter"
                      value={formData.medicalCenter || ''}
                      onChange={handleChange}
                      placeholder="Enter medical center name"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                    />
                    {errors.medicalCenter && <p className="text-red-500 text-xs mt-1">{errors.medicalCenter}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Conducted Date {formData.result !== 'pending' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      name="conductedDate"
                      value={formData.conductedDate}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                    />
                    {errors.conductedDate && <p className="text-red-500 text-xs mt-1">{errors.conductedDate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Result <span className="text-red-500">*</span></label>
                    <select
                      name="result"
                      value={formData.result}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                    >
                      {Object.entries(RESULT_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {formData.result === 'unfit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unfit Reason *</label>
                      <textarea
                        name="unfitReason"
                        value={formData.unfitReason}
                        onChange={handleChange}
                        rows={2}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                      />
                      {errors.unfitReason && <p className="text-red-500 text-xs mt-1">{errors.unfitReason}</p>}
                    </div>
                  )}

                  {formData.result === 'unfit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recheck Scheduled Date</label>
                      <input
                        type="date"
                        name="recheckScheduledDate"
                        value={formData.recheckScheduledDate}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Report Number</label>
                      <input
                        type="text"
                        name="reportNumber"
                        value={formData.reportNumber}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                      <input
                        type="date"
                        name="reportExpiryDate"
                        value={formData.reportExpiryDate}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload Medical Report</label>
                    {medical?.reportFileUrl && (
                      <a
                        href={resolveFileUrl(medical.reportFileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-xs text-primary-600 hover:text-primary-800 underline"
                      >
                        Current file: View uploaded medical report
                      </a>
                    )}
                    <input
                      type="file"
                      name="reportFile"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {errors.reportFile && <p className="text-red-500 text-xs mt-1">{errors.reportFile}</p>}
                    {reportFile && <p className="text-xs text-gray-500 mt-1">Selected: {reportFile.name}</p>}
                    <p className="text-xs text-gray-400 mt-1">Allowed: PDF, JPG, PNG, WEBP (max 10MB)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                    />
                  </div>
                </form>
                <p className="text-xs text-gray-500 mt-3">
                  <span className="text-red-500">*</span> Required fields only. Other fields are optional.
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