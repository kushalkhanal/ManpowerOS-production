import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sponsorsApi } from '../../api';
import { STATUS_COLORS, STATUS_LABELS, COUNTRY_FLAGS } from '../../utils/constants';

const getAvatarColor = (name) => {
  const colors = [
    'bg-primary-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-primary-500', 'bg-red-500', 'bg-teal-500', 'bg-orange-500'
  ];
  const hash = name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
  return colors[hash % colors.length];
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const SponsorProfileDrawer = ({ sponsorId, isOpen, onClose, onEdit }) => {
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (isOpen && sponsorId) {
      loadSponsor();
    }
  }, [isOpen, sponsorId]);

  const loadSponsor = async () => {
    setLoading(true);
    try {
      const response = await sponsorsApi.getById(sponsorId);
      setSponsor(response.data);
      setNotes(response.data.notes || '');
    } catch (err) {
      console.error('Failed to load sponsor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotesSave = async () => {
    setSavingNotes(true);
    try {
      await sponsorsApi.update(sponsorId, { notes });
      setSponsor(prev => ({ ...prev, notes }));
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const getDepartureRate = () => {
    if (!sponsor?.candidatesReferred) return 0;
    return Math.round((sponsor.candidatesDeparted / sponsor.candidatesReferred) * 100);
  };

  const getRateColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  const departureRate = getDepartureRate();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-xl flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : sponsor ? (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Sponsor Profile</h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${getAvatarColor(sponsor.fullName)}`}>
                  {getInitials(sponsor.fullName)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{sponsor.fullName}</h3>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    sponsor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sponsor.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {sponsor.phone && (
                <a href={`tel:${sponsor.phone}`} className="block text-primary-600 hover:underline mb-2">
                  {sponsor.phone}
                </a>
              )}

              {sponsor.primaryArea && (
                <p className="text-gray-600 mb-2">{sponsor.primaryArea}</p>
              )}

              {sponsor.coverageDistricts?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Districts covered:</p>
                  <div className="flex flex-wrap gap-1">
                    {sponsor.coverageDistricts.map((d, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{sponsor.candidatesReferred || 0}</div>
                  <div className="text-xs text-gray-500">Referred</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{sponsor.candidatesDeparted || 0}</div>
                  <div className="text-xs text-gray-500">Departed</div>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <div className={`text-xl font-bold ${getRateColor(departureRate)}`}>{departureRate}%</div>
                  <div className="text-xs text-gray-500">Rate</div>
                </div>
              </div>

              {sponsor.candidates?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Candidates from this sponsor ({sponsor.candidates.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sponsor.candidates.map(c => (
                      <Link
                        key={c._id}
                        to={`/candidates/${c._id}`}
                        className="block p-2 bg-gray-50 rounded hover:bg-gray-100"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{c.fullName}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[c.status] || 'bg-gray-100'}`}>
                            {STATUS_LABELS[c.status] || c.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>{c.desiredCountry ? `${COUNTRY_FLAGS[c.desiredCountry] || ''} ${c.desiredCountry}` : '-'}</span>
                          <span>{c.registeredAtBS || ''}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Info</h4>
                <div className="space-y-1 text-sm">
                  {sponsor.alternatePhone && <p>Alt: {sponsor.alternatePhone}</p>}
                  {sponsor.email && <p>Email: {sponsor.email}</p>}
                  {sponsor.citizenshipNumber && <p>Citizenship: {sponsor.citizenshipNumber}</p>}
                  {sponsor.currentAddress && <p>Address: {sponsor.currentAddress}</p>}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesSave}
                  disabled={savingNotes}
                  placeholder="Add notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>

              {sponsor.introducedBy && (
                <p className="text-xs text-gray-500">
                  Added by: {sponsor.introducedBy.name || 'Staff'}
                </p>
              )}
            </div>

            <div className="px-4 py-3 border-t flex gap-2">
              <button
                onClick={() => onEdit?.(sponsor)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Edit Sponsor
              </button>
              <button
                onClick={() => window.location.href = `/candidates?sponsor=${sponsor._id}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                View All Candidates
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Sponsor not found</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorProfileDrawer;