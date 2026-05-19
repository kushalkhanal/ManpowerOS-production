import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, AlertTriangle, CheckCircle, ChevronRight, Users } from 'lucide-react';
import { passportPoolApi, sponsorsApi, candidatesApi } from '../api';
import { showToast } from './ToastProvider';
import { getCountryFlag, STATUS_LABELS, STATUS_COLORS } from '../domain/workflow/index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const slotsLeft = (d) => (d.totalPositions || 0) - (d.filledPositions || 0);

// ─── Demand card ─────────────────────────────────────────────────────────────

const DemandCard = ({ demand, selected, onSelect }) => {
  const left = slotsLeft(demand);
  const pct = demand.totalPositions ? Math.round((demand.filledPositions / demand.totalPositions) * 100) : 0;
  const isFull = left <= 0;
  const isLow = left > 0 && left <= 2;

  return (
    <button
      type="button"
      disabled={isFull}
      onClick={() => !isFull && onSelect(demand._id)}
      className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
        isFull
          ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50'
          : selected
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none mt-0.5">{getCountryFlag(demand.employerCountry) || '🌐'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 truncate">{demand.employerCompanyName}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {demand.jobCategory}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{demand.employerCountry}</p>

          {/* Slots progress */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold flex-shrink-0 ${
              isFull ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {isFull ? 'Full' : `${left} left`}
            </span>
          </div>
        </div>
        {selected && !isFull && <CheckCircle size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />}
      </div>
      {isLow && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
          <AlertTriangle size={10} /> Only {left} slot{left > 1 ? 's' : ''} remaining
        </div>
      )}
    </button>
  );
};

// ─── Main modal ───────────────────────────────────────────────────────────────

const AllocationModal = ({ isOpen, onClose, passport, onSuccess }) => {
  const [demands, setDemands] = useState([]);
  const [demandSearch, setDemandSearch] = useState('');
  const [selectedDemand, setSelectedDemand] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Sponsor search
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [sponsors, setSponsors] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [showSponsorDropdown, setShowSponsorDropdown] = useState(false);

  // Agent search
  const [agentSearch, setAgentSearch] = useState('');
  const [agentList, setAgentList] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const agentRef = useRef(null);
  const sponsorRef = useRef(null);

  const [formData, setFormData] = useState({ phone: '' });

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      loadDemands();
      setFormData({ phone: passport?.contactPhone || passport?.candidateId?.phone || '' });
      setSelectedSponsor(null); setSponsorSearch('');
      setSelectedAgent(null); setAgentSearch('');
      setSelectedDemand('');
      setDemandSearch('');
      setConfirming(false);
      // Load agents once
      candidatesApi.getAgents().then(r => setAgentList(r.data || [])).catch(() => showToast.error('Failed to load agents'));
    }
  }, [isOpen, passport]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (agentRef.current && !agentRef.current.contains(e.target)) setShowAgentDropdown(false);
      if (sponsorRef.current && !sponsorRef.current.contains(e.target)) setShowSponsorDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sponsor search debounce
  useEffect(() => {
    if (sponsorSearch.length < 2) { setSponsors([]); setShowSponsorDropdown(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await sponsorsApi.search(sponsorSearch);
        setSponsors(r.data);
        setShowSponsorDropdown(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [sponsorSearch]);

  const loadDemands = async () => {
    setLoading(true);
    try {
      const r = await passportPoolApi.getActiveDemands();
      setDemands(r.data);
    } catch { showToast.error('Failed to load demands'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await passportPoolApi.allocate({
        passportId: passport._id,
        demandId: selectedDemand,
        phone: formData.phone,
        agentName: selectedAgent?.name || '',
        agentNumber: selectedAgent?.phone || '',
        sponsorId: selectedSponsor?._id,
        sponsorName: selectedSponsor?.fullName,
      });
      showToast.success('Passport allocated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to allocate passport');
    } finally {
      setSubmitting(false); setConfirming(false);
    }
  };

  const selectedDemandData = demands.find(d => d._id === selectedDemand);
  const filteredDemands = demands.filter(d => {
    if (!demandSearch) return true;
    const q = demandSearch.toLowerCase();
    return (
      d.employerCompanyName?.toLowerCase().includes(q) ||
      d.employerCountry?.toLowerCase().includes(q) ||
      d.jobCategory?.toLowerCase().includes(q)
    );
  });

  const filteredAgents = agentList.filter(a => {
    const q = agentSearch.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.phone?.includes(q);
  });

  const candidateStatus = passport?.candidateId?.status;
  const remainingAfter = selectedDemandData ? slotsLeft(selectedDemandData) - 1 : null;

  if (!isOpen) return null;

  // ── Confirmation screen ──
  if (confirming && selectedDemandData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={() => setConfirming(false)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <CheckCircle size={20} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Confirm allocation</h3>
              <p className="text-xs text-gray-400">Review before proceeding</p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="text-gray-400 text-xs mb-0.5">Passport</p>
              <p className="font-semibold text-gray-800">{passport.passportNumber} — {passport.fullName}</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-3 text-sm">
              <p className="text-gray-400 text-xs mb-0.5">Demand</p>
              <p className="font-semibold text-gray-800">{selectedDemandData.employerCompanyName}</p>
              <p className="text-primary-600 text-xs">{getCountryFlag(selectedDemandData.employerCountry)} {selectedDemandData.employerCountry} · {selectedDemandData.jobCategory}</p>
            </div>
            {remainingAfter !== null && (
              <div className={`rounded-xl p-3 text-sm ${remainingAfter <= 1 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                <p className={`text-xs font-semibold ${remainingAfter <= 1 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {remainingAfter <= 0 ? '⚠ This will fill the last slot' : `${remainingAfter} slot${remainingAfter !== 1 ? 's' : ''} will remain after allocation`}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? 'Allocating…' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main modal ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Allocate to Demand</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Passport card */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
              {getInitials(passport.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{passport.fullName}</p>
              <p className="text-xs text-gray-500">{passport.passportNumber}{passport.issuedDistrict ? ` · ${passport.issuedDistrict}` : ''}</p>
            </div>
            {candidateStatus && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS?.[candidateStatus] || 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABELS?.[candidateStatus] || candidateStatus}
              </span>
            )}
          </div>

          {/* Demand selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Select Demand *</label>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : demands.length === 0 ? (
              <div className="text-center py-6 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Users size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">No active demands available</p>
                <Link to="/demands/new" onClick={onClose} className="mt-1 inline-block text-xs text-primary-600 hover:underline">
                  Create a new demand →
                </Link>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by company, country, job…"
                    value={demandSearch}
                    onChange={e => setDemandSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                  />
                </div>

                {/* Demand cards */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {filteredDemands.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-3">No demands match "{demandSearch}"</p>
                  ) : filteredDemands.map(d => (
                    <DemandCard key={d._id} demand={d} selected={selectedDemand === d._id} onSelect={setSelectedDemand} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Selected demand preview */}
          {selectedDemandData && (
            <div className="p-3 bg-primary-50 border border-primary-100 rounded-xl text-sm space-y-1">
              <p className="font-semibold text-primary-900">{selectedDemandData.employerCompanyName}</p>
              <p className="text-primary-700 text-xs">{getCountryFlag(selectedDemandData.employerCountry)} {selectedDemandData.employerCountry} · {selectedDemandData.jobCategory}</p>
              {(selectedDemandData.minAge || selectedDemandData.maxAge) && (
                <p className="text-primary-600 text-xs">Age: {selectedDemandData.minAge || 'any'} – {selectedDemandData.maxAge || 'any'}</p>
              )}
              {selectedDemandData.genderPreference && selectedDemandData.genderPreference !== 'any' && (
                <p className="text-primary-600 text-xs">Gender: {selectedDemandData.genderPreference}</p>
              )}
              {(selectedDemandData.basicSalary || selectedDemandData.salary) && (
                <p className="text-primary-600 text-xs">Salary: {selectedDemandData.basicSalary || selectedDemandData.salary}</p>
              )}
            </div>
          )}

          {/* Additional details */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Additional details (optional)</p>

            {/* Phone */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="98XXXXXXXX"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
            </div>

            {/* Agent search from directory */}
            <div ref={agentRef}>
              <label className="block text-xs text-gray-500 mb-1">Agent (from directory)</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={selectedAgent ? selectedAgent.name : agentSearch}
                  onChange={e => { setAgentSearch(e.target.value); setSelectedAgent(null); setShowAgentDropdown(true); }}
                  onFocus={() => setShowAgentDropdown(true)}
                  placeholder="Search agent by name or phone…"
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
                {selectedAgent && (
                  <button
                    onClick={() => { setSelectedAgent(null); setAgentSearch(''); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                  >
                    <X size={13} />
                  </button>
                )}
                {showAgentDropdown && !selectedAgent && filteredAgents.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                    {filteredAgents.map(a => (
                      <button
                        key={a._id}
                        type="button"
                        onClick={() => { setSelectedAgent(a); setAgentSearch(a.name); setShowAgentDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 flex-shrink-0">
                          {getInitials(a.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{a.name}</p>
                          {a.phone && <p className="text-xs text-gray-400">{a.phone}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sponsor search */}
            <div ref={sponsorRef}>
              <label className="block text-xs text-gray-500 mb-1">Referred by agent (optional)</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={selectedSponsor ? selectedSponsor.fullName : sponsorSearch}
                  onChange={e => { setSponsorSearch(e.target.value); setSelectedSponsor(null); }}
                  placeholder="Search from agents directory…"
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
                {selectedSponsor && (
                  <button onClick={() => { setSelectedSponsor(null); setSponsorSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                    <X size={13} />
                  </button>
                )}
                {showSponsorDropdown && sponsors.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                    {sponsors.map(s => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => { setSelectedSponsor(s); setSponsorSearch(s.fullName); setShowSponsorDropdown(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        <p className="font-medium text-gray-800">{s.fullName}</p>
                        <p className="text-xs text-gray-400">{s.phone}{s.primaryArea ? ` · ${s.primaryArea}` : ''}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={() => setConfirming(true)}
            disabled={!selectedDemand || demands.length === 0 || slotsLeft(selectedDemandData || {}) <= 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Allocate <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllocationModal;
