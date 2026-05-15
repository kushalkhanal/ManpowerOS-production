import { useState, useEffect } from 'react';
import { passportPoolApi } from '../api';
import { sponsorsApi } from '../api';
import { showToast } from './ToastProvider';

const AllocationModal = ({ isOpen, onClose, passport, onSuccess }) => {
  const [demands, setDemands] = useState([]);
  const [selectedDemand, setSelectedDemand] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [showSponsorDropdown, setShowSponsorDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: '',
    agentName: '',
    agentNumber: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadDemands();
      setFormData(prev => ({
        ...prev,
        phone: passport?.contactPhone || passport?.candidateId?.phone || ''
      }));
      setSelectedSponsor(null);
      setSponsorSearch('');
    }
  }, [isOpen, passport]);

  useEffect(() => {
    if (sponsorSearch.length >= 2) {
      const searchSponsors = setTimeout(async () => {
        try {
          const response = await sponsorsApi.search(sponsorSearch);
          setSponsors(response.data);
          setShowSponsorDropdown(true);
        } catch (err) {
          console.error('Search sponsors error:', err);
        }
      }, 300);
      return () => clearTimeout(searchSponsors);
    } else {
      setSponsors([]);
      setShowSponsorDropdown(false);
    }
  }, [sponsorSearch]);

  const loadDemands = async () => {
    setLoading(true);
    try {
      const response = await passportPoolApi.getActiveDemands();
      setDemands(response.data);
      if (response.data.length > 0) {
        setSelectedDemand(response.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load demands:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedDemand) {
      showToast.error('Please select a demand');
      return;
    }

    setSubmitting(true);
    try {
      await passportPoolApi.allocate({
        passportId: passport._id,
        demandId: selectedDemand,
        phone: formData.phone,
        agentName: formData.agentName,
        agentNumber: formData.agentNumber,
        sponsorId: selectedSponsor?._id,
        sponsorName: selectedSponsor?.fullName
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Allocation failed:', err);
      showToast.error(err.response?.data?.message || 'Failed to allocate passport');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDemandData = demands.find(d => d._id === selectedDemand);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Allocate passport to demand</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Passport</p>
              <p className="font-medium">{passport.passportNumber} — {passport.fullName}</p>
              {passport.issuedDistrict && (
                <p className="text-sm text-gray-500">{passport.issuedDistrict}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Demand *
              </label>
              {loading ? (
                <p className="text-gray-500">Loading demands...</p>
              ) : demands.length === 0 ? (
                <p className="text-red-500">No active demands available</p>
              ) : (
                <select
                  value={selectedDemand}
                  onChange={(e) => setSelectedDemand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {demands.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.employerCountry} - {d.jobCategory} - {d.employerCompanyName} 
                      ({d.totalPositions - d.filledPositions} slots left)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedDemandData && (
              <div className="p-3 bg-primary-50 rounded-lg text-sm">
                <p className="font-medium text-primary-900">{selectedDemandData.employerCompanyName}</p>
                <p className="text-primary-700">{selectedDemandData.employerCountry} | {selectedDemandData.jobCategory}</p>
                {selectedDemandData.minAge || selectedDemandData.maxAge && (
                  <p className="text-primary-600">
                    Age: {selectedDemandData.minAge || 'any'} - {selectedDemandData.maxAge || 'any'}
                  </p>
                )}
                {selectedDemandData.genderPreference !== 'any' && (
                  <p className="text-primary-600">Gender: {selectedDemandData.genderPreference}</p>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Additional details (optional)</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500">Phone number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500">Agent name</label>
                    <input
                      type="text"
                      name="agentName"
                      value={formData.agentName}
                      onChange={handleChange}
                      placeholder="Agent name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Agent number</label>
                    <input
                      type="text"
                      name="agentNumber"
                      value={formData.agentNumber}
                      onChange={handleChange}
                      placeholder="Agent number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs text-gray-500">Referred by sponsor (optional)</label>
                  <input
                    type="text"
                    value={selectedSponsor ? selectedSponsor.fullName : sponsorSearch}
                    onChange={(e) => {
                      setSponsorSearch(e.target.value);
                      setSelectedSponsor(null);
                    }}
                    placeholder="Search sponsor..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {showSponsorDropdown && sponsors.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {sponsors.map(s => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => {
                            setSelectedSponsor(s);
                            setSponsorSearch(s.fullName);
                            setShowSponsorDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          <div className="font-medium">{s.fullName}</div>
                          <div className="text-xs text-gray-500">{s.phone} — {s.primaryArea || 'No area'}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedDemand || demands.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Allocating...' : 'Allocate →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationModal;