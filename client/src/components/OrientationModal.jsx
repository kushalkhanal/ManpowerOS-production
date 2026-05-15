import { useState, useEffect } from 'react';
import { useOrientation } from '../hooks/useOrientation';
import { ORIENTATION_FEE } from '../utils/constants';
import { isValidFileSize, isValidFileType } from '../utils/validation';

const OrientationModal = ({ isOpen, onClose, orientation, candidateId, onSuccess }) => {
  const { updateOrientation, loading } = useOrientation();
  const [formData, setFormData] = useState({
    certificateNumber: '',
    certificateIssuedDate: '',
    notes: ''
  });
  const [certificateFile, setCertificateFile] = useState(null);
  const [errors, setErrors] = useState({});
  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
  const maxFileSize = 10 * 1024 * 1024;
  const resolveFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_SERVER_URL || ''}${url}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      certificateNumber: orientation?.certificateNumber || '',
      certificateIssuedDate: orientation?.certificateIssuedDate ? orientation.certificateIssuedDate.split('T')[0] : '',
      notes: orientation?.notes || ''
    });
    setCertificateFile(null);
    setErrors({});
  }, [isOpen, orientation]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'certificateFile' && files?.length) {
      const selectedFile = files[0];
      if (!isValidFileType(selectedFile, allowedFileTypes)) {
        setErrors(prev => ({ ...prev, certificateFile: 'Only JPG, PNG, WEBP, and PDF are allowed' }));
        return;
      }
      if (!isValidFileSize(selectedFile, maxFileSize)) {
        setErrors(prev => ({ ...prev, certificateFile: 'File must be 10MB or smaller' }));
        return;
      }
      setCertificateFile(selectedFile);
      setErrors(prev => ({ ...prev, certificateFile: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.certificateNumber.trim()) {
      setErrors({ certificateNumber: 'Please fill "Certificate Number" in Orientation section' });
      return;
    }

    try {
      await updateOrientation(orientation._id, {
        completionStatus: 'completed',
        certificateNumber: formData.certificateNumber,
        certificateIssuedDate: formData.certificateIssuedDate || undefined,
        notes: formData.notes || undefined,
        certificateFile
      });
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ submit: err.message });
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
                  Mark Orientation Completed
                </h3>

                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{errors.submit}</div>
                )}

                <div className="mb-4 p-3 bg-primary-50 rounded-md">
                  <p className="text-sm text-primary-700">
                    Fee Amount: NPR {ORIENTATION_FEE}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Certificate Number *</label>
                    <input
                      type="text"
                      name="certificateNumber"
                      value={formData.certificateNumber}
                      onChange={handleChange}
                      placeholder="e.g., DOFE/2026/001"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                    />
                    {errors.certificateNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.certificateNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Certificate Issued Date</label>
                    <input
                      type="date"
                      name="certificateIssuedDate"
                      value={formData.certificateIssuedDate}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500"
                    />
                    {errors.certificateIssuedDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.certificateIssuedDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload Certificate</label>
                    {orientation?.certificateFileUrl && (
                      <a
                        href={resolveFileUrl(orientation.certificateFileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-xs text-primary-600 hover:text-primary-800 underline"
                      >
                        Current file: View uploaded certificate
                      </a>
                    )}
                    <input
                      type="file"
                      name="certificateFile"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {errors.certificateFile && (
                      <p className="text-red-500 text-xs mt-1">{errors.certificateFile}</p>
                    )}
                    {certificateFile && <p className="text-xs text-gray-500 mt-1">Selected: {certificateFile.name}</p>}
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
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Mark Completed'}
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

export default OrientationModal;