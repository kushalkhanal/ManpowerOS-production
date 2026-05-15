import { useState, useEffect } from 'react';
import { candidatesApi } from '../api';

const CallingVisaModal = ({ isOpen, onClose, candidateId, candidateData, demand, onSuccess }) => {
  const [formData, setFormData] = useState({ visaNumber: '', visaReceivedDate: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (candidateData) {
      setFormData({
        visaNumber: candidateData.visaNumber || '',
        visaReceivedDate: candidateData.visaReceivedDate ? candidateData.visaReceivedDate.split('T')[0] : ''
      });
    }
  }, [candidateData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
      await candidatesApi.update(candidateId, {
        visaNumber: formData.visaNumber.trim(),
        visaReceivedDate: formData.visaReceivedDate || undefined
      });
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
