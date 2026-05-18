import { useState, useEffect } from 'react';
import { candidatesApi } from '../api';
import { isValidFileSize, isValidFileType } from '../utils/validation';
import { useSecureDocUrl } from '../utils/secureDocUrl';

const VisaModal = ({ isOpen, onClose, candidateId, candidateData, onSuccess }) => {
  const [formData, setFormData] = useState({
    visaNumber: '',
    visaReceivedDate: '',
    visaExpiryDate: '',
  });
  const [visaFile, setVisaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
  const maxFileSize = 10 * 1024 * 1024;
  const { url: secureVisaUrl } = useSecureDocUrl(candidateData?.visaFileUrl);

  useEffect(() => {
    if (candidateData) {
      setFormData({
        visaNumber: candidateData.visaNumber || '',
        visaReceivedDate: candidateData.visaReceivedDate ? candidateData.visaReceivedDate.split('T')[0] : '',
        visaExpiryDate: candidateData.visaExpiryDate ? candidateData.visaExpiryDate.split('T')[0] : '',
      });
    }
    setVisaFile(null);
  }, [candidateData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'visaFile' && files?.length) {
      const selectedFile = files[0];
      if (!isValidFileType(selectedFile, allowedFileTypes)) {
        setErrors(prev => ({ ...prev, visaFile: 'Only JPG, PNG, WEBP, and PDF are allowed' }));
        return;
      }
      if (!isValidFileSize(selectedFile, maxFileSize)) {
        setErrors(prev => ({ ...prev, visaFile: 'File must be 10MB or smaller' }));
        return;
      }
      setVisaFile(selectedFile);
      setErrors(prev => ({ ...prev, visaFile: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.visaNumber?.trim()) nextErrors.visaNumber = 'Please fill "Visa Number" in Visa section';
    if (formData.visaExpiryDate && formData.visaReceivedDate) {
      const expiry = new Date(formData.visaExpiryDate);
      const received = new Date(formData.visaReceivedDate);
      if (expiry < received) nextErrors.visaExpiryDate = 'Expiry date cannot be before received date';
    }
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const dataToSend = { ...formData };
      if (visaFile) {
        dataToSend.visaFile = visaFile;
      }
      await candidatesApi.update(candidateId, dataToSend);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Update Visa</h3>
            {errors.submit && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{errors.submit}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Visa Number *</label>
                <input type="text" name="visaNumber" value={formData.visaNumber || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                {errors.visaNumber && <p className="text-xs text-red-600 mt-1">{errors.visaNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visa Received Date</label>
                <input type="date" name="visaReceivedDate" value={formData.visaReceivedDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                {errors.visaReceivedDate && <p className="text-xs text-red-600 mt-1">{errors.visaReceivedDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visa Expiry Date</label>
                <input type="date" name="visaExpiryDate" value={formData.visaExpiryDate || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                {errors.visaExpiryDate && <p className="text-xs text-red-600 mt-1">{errors.visaExpiryDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Visa Copy</label>
                {candidateData?.visaFileUrl && secureVisaUrl && (
                  <a
                    href={secureVisaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-primary-600 hover:text-primary-800 underline"
                  >
                    Current file: View uploaded visa file
                  </a>
                )}
                <input type="file" name="visaFile" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                {errors.visaFile && <p className="text-xs text-red-600 mt-1">{errors.visaFile}</p>}
                {visaFile && <p className="text-xs text-gray-500 mt-1">Selected: {visaFile.name}</p>}
                <p className="text-xs text-gray-400 mt-1">Allowed: PDF, JPG, PNG, WEBP (max 10MB)</p>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-3">
              <span className="text-red-500">*</span> Required fields only. Other fields are optional.
            </p>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button onClick={handleSubmit} disabled={loading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaModal;