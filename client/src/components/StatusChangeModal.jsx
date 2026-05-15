import { useState, useEffect } from 'react';
import { usePassports } from '../hooks/usePassports';

const StatusChangeModal = ({ isOpen, onClose, currentStatus, passportId, passport, onSuccess }) => {
  const { updatePassportStatus } = usePassports();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    custodyStatus: '',
    notes: '',
    location: '',
    sponsorName: passport?.sponsorName || '',
    sponsorNumber: passport?.sponsorNumber || '',
    assignedStaff: passport?.assignedStaff || ''
  });
  const [errors, setErrors] = useState({});

  const validTransitions = {
    'with_agency': ['returned_to_candidate', 'submitted_embassy', 'lost'],
    'returned_to_candidate': ['with_agency'],
    'submitted_embassy': ['with_agency', 'lost'],
    'lost': []
  };

  const statusLabels = {
    'with_agency': 'With Agency',
    'returned_to_candidate': 'Returned to Candidate',
    'submitted_embassy': 'Submitted to Embassy',
    'lost': 'Lost'
  };

  const availableStatuses = validTransitions[currentStatus] || [];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        custodyStatus: '',
        notes: '',
        location: '',
        sponsorName: passport?.sponsorName || '',
        sponsorNumber: passport?.sponsorNumber || '',
        assignedStaff: passport?.assignedStaff || ''
      });
      setErrors({});
    }
  }, [isOpen, currentStatus, passport]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.custodyStatus) {
      newErrors.custodyStatus = 'Please select a status';
    }
    if (formData.custodyStatus === 'lost' && !formData.notes) {
      newErrors.notes = 'Notes are required when marking as lost';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await updatePassportStatus(passportId, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message }));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Update Status and Sponsor
                </h3>

                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-500">Current Status: </span>
                  <span className="text-sm font-medium">{statusLabels[currentStatus]}</span>
                </div>

                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {errors.submit}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Status *</label>
                    <select
                      name="custodyStatus"
                      value={formData.custodyStatus}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Select status</option>
                      {availableStatuses.map(status => (
                        <option key={status} value={status}>{statusLabels[status]}</option>
                      ))}
                    </select>
                    {errors.custodyStatus && (
                      <p className="mt-1 text-sm text-red-600">{errors.custodyStatus}</p>
                    )}
                    {availableStatuses.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No valid status transitions available</p>
                    )}
                  </div>

                  {formData.custodyStatus === 'with_agency' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Storage Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Cabinet A, Shelf 3"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notes {formData.custodyStatus === 'lost' && '*'}
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Add any relevant notes..."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    {errors.notes && (
                      <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Optional Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sponsor Name</label>
                        <input
                          type="text"
                          name="sponsorName"
                          value={formData.sponsorName}
                          onChange={handleChange}
                          placeholder="Overseas Sponsor/Company"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sponsor Number</label>
                        <input
                          type="text"
                          name="sponsorNumber"
                          value={formData.sponsorNumber}
                          onChange={handleChange}
                          placeholder="Sponsor Contact Number"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned Staff</label>
                        <input
                          type="text"
                          name="assignedStaff"
                          value={formData.assignedStaff}
                          onChange={handleChange}
                          placeholder="Name of handling staff"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || availableStatuses.length === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusChangeModal;