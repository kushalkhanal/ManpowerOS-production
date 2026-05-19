import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Phone, MapPin, Users, PlaneTakeoff, TrendingUp, Clock } from 'lucide-react';
import { sponsorsApi } from '../../api';
import { STATUS_COLORS, STATUS_LABELS, COUNTRY_FLAGS } from '../../utils/constants';

const AGENT_STATUS = [
  { value: 'active',      label: 'Active',      cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'passive',     label: 'Passive',     cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'blacklisted', label: 'Blacklisted', cls: 'bg-red-100 text-red-800 border-red-200' },
];

const getAvatarColor = (name) => {
  const colors = ['bg-primary', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500'];
  const hash = name?.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
  return colors[hash % colors.length];
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const formatLastReferral = (date) => {
  if (!date) return 'Never';
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const SponsorProfileDrawer = ({ sponsorId, isOpen, onClose, onEdit, onStatusChange }) => {
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && sponsorId) loadSponsor();
  }, [isOpen, sponsorId]);

  const loadSponsor = async () => {
    setLoading(true);
    try {
      const response = await sponsorsApi.getById(sponsorId);
      setSponsor(response.data);
      setNotes(response.data.notes || '');
    } catch (err) {
      console.error('Failed to load agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotesSave = async () => {
    setSavingNotes(true);
    try {
      await sponsorsApi.update(sponsorId, { notes });
      setSponsor(prev => ({ ...prev, notes }));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (updatingStatus || sponsor?.agentStatus === newStatus) return;
    setUpdatingStatus(true);
    try {
      await sponsorsApi.update(sponsorId, { agentStatus: newStatus });
      setSponsor(prev => ({ ...prev, agentStatus: newStatus }));
      onStatusChange?.(sponsorId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  const totalReferred  = sponsor?.candidatesReferred || 0;
  const totalDeparted  = sponsor?.candidatesDeparted || 0;
  const totalActive    = sponsor?.candidatesActive   ?? (sponsor?.totalActive ?? 0);
  const successRate    = totalReferred > 0 ? Math.round((totalDeparted / totalReferred) * 100) : 0;
  const lastReferral   = sponsor?.lastReferralDate;
  const currentStatus  = sponsor?.agentStatus || 'active';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Agent Profile</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
        ) : !sponsor ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Agent not found</div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Identity */}
              <div className="px-5 py-5 border-b border-gray-50">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 ${getAvatarColor(sponsor.fullName)}`}>
                    {getInitials(sponsor.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{sponsor.fullName}</h3>
                    {sponsor.phone && (
                      <a href={`tel:${sponsor.phone}`} className="flex items-center gap-1 text-sm text-primary hover:underline mt-0.5">
                        <Phone size={12} /> {sponsor.phone}
                      </a>
                    )}
                    {(sponsor.permanentDistrict || sponsor.primaryArea) && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin size={11} /> {sponsor.permanentDistrict || sponsor.primaryArea}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-5 py-4 border-b border-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={14} className="text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium">Total Sent</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{totalReferred}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <PlaneTakeoff size={14} className="text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">Departed</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">{totalDeparted}</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={14} className="text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">Active Pipeline</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-700">{totalActive}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-500 font-medium">Last Referral</span>
                    </div>
                    <div className="text-base font-semibold text-gray-700">{formatLastReferral(lastReferral)}</div>
                  </div>
                </div>
              </div>

              {/* Status management */}
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Agent Status</p>
                <div className="flex gap-2">
                  {AGENT_STATUS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      disabled={updatingStatus}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        currentStatus === s.value
                          ? `${s.cls} border-current shadow-sm`
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candidates list */}
              {sponsor.candidates?.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-50">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Candidates ({sponsor.candidates.length})
                  </h4>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {sponsor.candidates.map(c => (
                      <Link
                        key={c._id}
                        to={`/candidates/${c._id}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.fullName}</p>
                          <p className="text-xs text-gray-400">
                            {c.desiredCountry ? `${COUNTRY_FLAGS?.[c.desiredCountry] || ''} ${c.desiredCountry}` : '—'}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact details */}
              <div className="px-5 py-4 border-b border-gray-50">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact Info</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {sponsor.alternatePhone && <p>Alt: {sponsor.alternatePhone}</p>}
                  {sponsor.email && <p>Email: {sponsor.email}</p>}
                  {sponsor.citizenshipNumber && <p>Citizenship: {sponsor.citizenshipNumber}</p>}
                  {sponsor.currentAddress && <p>Address: {sponsor.currentAddress}</p>}
                  {sponsor.coverageDistricts?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {sponsor.coverageDistricts.map((d, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="px-5 py-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesSave}
                  disabled={savingNotes}
                  placeholder="Add notes about this agent..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex gap-2 bg-gray-50">
              <button
                onClick={() => onEdit?.(sponsor)}
                className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Edit Agent
              </button>
              <Link
                to={`/candidates?sponsor=${sponsor._id}`}
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-white transition-colors text-center"
              >
                All Candidates
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SponsorProfileDrawer;
