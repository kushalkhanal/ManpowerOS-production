import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useJobDemands } from '../hooks/useJobDemands';
import { passportPoolApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  COUNTRY_FLAGS, DEMAND_STATUS_COLORS, DEMAND_STATUS_LABELS, NEPAL_MINIMUM_WAGE
} from '../utils/constants';
import { ConfirmDialog } from '../components/ui';
import { showToast } from '../components/ToastProvider';
import { formatNPR } from '../utils/currency';
import {
  ArrowLeft, RefreshCw, UserPlus, Pencil, AlertCircle, AlertTriangle,
  X, Search, FileText, Briefcase, Building2, Mail, Phone, MapPin, Calendar
} from 'lucide-react';

// ─── Constants & helpers ──────────────────────────────────────────────────────

const USD_TO_NPR = 130;

const fmtDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const daysUntil = (d) => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;

// ─── Subcomponents ────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-[11px] uppercase tracking-wide text-gray-400 flex items-center gap-1.5 shrink-0">
      {Icon && <Icon size={11} />} {label}
    </span>
    <span className="text-sm text-gray-800 font-medium text-right truncate">{value || '—'}</span>
  </div>
);

const PanelCard = ({ title, children, action }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {action}
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditDemandModal({ demand, open, onClose, onSave, saving, errors }) {
  const [form, setForm] = useState({
    employerCompanyName: '', shortCompanyCode: '', employerCountry: '', employerCity: '',
    employerContactPerson: '', employerPhone: '', employerEmail: '', jobCategory: '',
    totalPositions: '', basicSalaryUSD: '',
    demandLetterDate: '', demandLetterExpiryDate: '', notes: ''
  });

  useEffect(() => {
    if (!open || !demand) return;
    setForm({
      employerCompanyName:    demand.employerCompanyName || '',
      shortCompanyCode:       demand.shortCompanyCode || '',
      employerCountry:        demand.employerCountry || '',
      employerCity:           demand.employerCity || '',
      employerContactPerson:  demand.employerContactPerson || '',
      employerPhone:          demand.employerPhone || '',
      employerEmail:          demand.employerEmail || '',
      jobCategory:            demand.jobCategory || '',
      totalPositions:         demand.totalPositions || '',
      basicSalaryUSD:         demand.basicSalaryUSD || '',
      demandLetterDate:       demand.demandLetterDate ? demand.demandLetterDate.split('T')[0] : '',
      demandLetterExpiryDate: demand.demandLetterExpiryDate ? demand.demandLetterExpiryDate.split('T')[0] : '',
      notes:                  demand.notes || ''
    });
  }, [open, demand]);

  if (!open) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Edit Demand</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Field label="Company name *" name="employerCompanyName" value={form.employerCompanyName} error={errors.employerCompanyName} onChange={change} span={2} />
          <Field label="Short company code" name="shortCompanyCode" value={form.shortCompanyCode} error={errors.shortCompanyCode} onChange={change} />
          <Field label="Country *" name="employerCountry" value={form.employerCountry} error={errors.employerCountry} onChange={change} />
          <Field label="City" name="employerCity" value={form.employerCity} onChange={change} />
          <Field label="Contact person" name="employerContactPerson" value={form.employerContactPerson} onChange={change} />
          <Field label="Company phone" name="employerPhone" value={form.employerPhone} onChange={change} />
          <Field label="Company email" name="employerEmail" value={form.employerEmail} onChange={change} />
          <Field label="Job category" name="jobCategory" value={form.jobCategory} onChange={change} />
          <Field label="Total positions *" type="number" min={1} name="totalPositions" value={form.totalPositions} error={errors.totalPositions} onChange={change} />
          <Field label="Basic salary (USD)" type="number" min={0} name="basicSalaryUSD" value={form.basicSalaryUSD} onChange={change} />
          <Field label="Demand letter date" type="date" name="demandLetterDate" value={form.demandLetterDate} onChange={change} />
          <Field label="Demand letter expiry" type="date" name="demandLetterExpiryDate" value={form.demandLetterExpiryDate} onChange={change} />
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea name="notes" value={form.notes} onChange={change} rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, error, onChange, type = 'text', min, span = 1 }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type} min={min} name={name} value={value} onChange={onChange}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none ${error ? 'border-red-300' : 'border-gray-200'}`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ─── Assign passport modal ────────────────────────────────────────────────────

function AssignPassportModal({ open, onClose, passports, loading, onAssign, allocatingId }) {
  const [search, setSearch] = useState('');

  if (!open) return null;

  const q = search.trim().toLowerCase();
  const filtered = passports.filter(p =>
    !q ||
    p.fullName?.toLowerCase().includes(q) ||
    p.passportNumber?.toLowerCase().includes(q) ||
    p.districtOfOrigin?.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Assign from Passport Pool</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, passport, district…"
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>
        </div>

        <div className="px-5 py-3 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading matching passports…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              {search ? `No matches for "${search}"` : 'No passports available in pool for this demand.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map(p => (
                <li key={p._id} className="border border-gray-100 rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.fullName}</p>
                      <p className="text-xs font-mono text-gray-500">{p.passportNumber}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {p.gender || '—'} · Age {p.age || '—'} · {p.districtOfOrigin || p.issuedDistrict || '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => onAssign(p._id)}
                      disabled={allocatingId === p._id}
                      className="px-3 py-1 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
                    >
                      {allocatingId === p._id ? 'Assigning…' : 'Assign'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DemandDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const {
    currentDemand, loading, error, getDemandById, updateDemand, removeCandidate
  } = useJobDemands();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [matchingPassports, setMatchingPassports] = useState([]);
  const [loadingPassports, setLoadingPassports]   = useState(false);
  const [allocatingPassportId, setAllocatingPassportId] = useState(null);

  const [candidateToRemove, setCandidateToRemove] = useState(null);
  const [statusToChange, setStatusToChange]       = useState(null);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit]       = useState(false);
  const [editErrors, setEditErrors]       = useState({});

  useEffect(() => { getDemandById(id); }, [id]);

  const isAdminOrSuper = user?.role === 'admin' || user?.role === 'superadmin';

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSaveEdit = async (form) => {
    const errors = {};
    if (!form.employerCompanyName.trim()) errors.employerCompanyName = 'Company name is required';
    if (!form.employerCountry.trim())     errors.employerCountry = 'Country is required';
    if (!form.totalPositions || Number(form.totalPositions) < 1) {
      errors.totalPositions = 'Total positions must be at least 1';
    }
    if (Number(form.totalPositions || 0) < Number(currentDemand?.filledPositions || 0)) {
      errors.totalPositions = `Cannot be less than filled positions (${currentDemand?.filledPositions || 0})`;
    }
    if (Object.keys(errors).length) { setEditErrors(errors); return; }

    try {
      setSavingEdit(true);
      await updateDemand(id, {
        ...form,
        totalPositions: Number(form.totalPositions),
        basicSalaryUSD: form.basicSalaryUSD === '' ? undefined : Number(form.basicSalaryUSD),
      });
      await getDemandById(id);
      setShowEditModal(false);
      setEditErrors({});
      showToast.success('Demand updated');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const mapped = {};
        apiErrors.forEach((issue) => { if (issue?.field) mapped[issue.field] = issue.message; });
        setEditErrors(mapped);
      } else {
        showToast.error(err.response?.data?.message || 'Failed to update demand');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (!newStatus || newStatus === currentDemand?.status) return;
    setStatusToChange(newStatus);
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!statusToChange) return;
    try {
      await updateDemand(id, { status: statusToChange });
      getDemandById(id);
      showToast.success('Status updated');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setShowStatusConfirm(false);
      setStatusToChange(null);
    }
  };

  const handleAssign = async (passportId) => {
    try {
      setAllocatingPassportId(passportId);
      await passportPoolApi.allocate({ passportId, demandId: id });
      showToast.success('Passport allocated and candidate created');
      getDemandById(id);
      setShowAssignModal(false);
      setMatchingPassports([]);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to allocate from passport pool');
    } finally {
      setAllocatingPassportId(null);
    }
  };

  const handleRemove = async () => {
    if (!candidateToRemove) return;
    try {
      await removeCandidate(id, candidateToRemove);
      getDemandById(id);
      setCandidateToRemove(null);
      showToast.success('Candidate removed from demand');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to remove candidate');
    }
  };

  const loadMatchingPassports = async () => {
    try {
      setLoadingPassports(true);
      setShowAssignModal(true);
      const response = await passportPoolApi.getMatchingPassports(id);
      setMatchingPassports(response.data?.passports || []);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to load passport pool');
      setShowAssignModal(false);
    } finally {
      setLoadingPassports(false);
    }
  };

  // ── Render guards ────────────────────────────────────────────────────────────

  if (loading && !currentDemand) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-3">
          <div className="h-10 w-72 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="lg:col-span-2 h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
            <div className="space-y-3">
              <div className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
              <div className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-sm text-gray-600">{error}</p>
        <button onClick={() => getDemandById(id)} className="text-sm text-primary hover:underline">Try again</button>
      </div>
    );
  }

  if (!currentDemand) return null;

  // ── Derived ──

  const filled  = Number(currentDemand.filledPositions) || 0;
  const total   = Number(currentDemand.totalPositions)  || 0;
  const fillPct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;

  const days       = daysUntil(currentDemand.demandLetterExpiryDate);
  const isExpired  = days !== null && days <= 0;
  const isExpiring = days !== null && days > 0 && days <= 30;

  const salaryUSD = Number(currentDemand.basicSalaryUSD) || 0;
  const salaryNPR = salaryUSD * USD_TO_NPR;
  const lowSalary = salaryUSD > 0 && salaryNPR < NEPAL_MINIMUM_WAGE;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/demands"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Back to demands"
          >
            <ArrowLeft size={17} />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base leading-none" title={currentDemand.employerCountry}>
                {COUNTRY_FLAGS[currentDemand.employerCountry] || '🌍'}
              </span>
              <h1 className="text-base font-bold text-gray-900 leading-tight truncate">
                {currentDemand.employerCompanyName}
              </h1>
              <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${DEMAND_STATUS_COLORS[currentDemand.status] || 'bg-gray-100 text-gray-600'}`}>
                {DEMAND_STATUS_LABELS[currentDemand.status] || currentDemand.status}
              </span>
              {currentDemand.shortCompanyCode && (
                <span className="text-[11px] text-gray-400 font-mono">· {currentDemand.shortCompanyCode}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => getDemandById(id)}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={loadMatchingPassports}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700"
            >
              <UserPlus size={14} /> Assign
            </button>
            {isAdminOrSuper && (
              <button
                onClick={() => { setEditErrors({}); setShowEditModal(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Slot fill bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${fillPct >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <span className="text-[11px] text-gray-500 tabular-nums">
            {filled}/{total} slots
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-6 lg:px-8 py-5">

        {/* Expiry warning banner */}
        {(isExpired || isExpiring) && (
          <div className={`flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl text-sm ${isExpired ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              {isExpired
                ? `Demand letter expired ${-days} day${-days === 1 ? '' : 's'} ago.`
                : `Demand letter expires in ${days} day${days === 1 ? '' : 's'} (${fmtDate(currentDemand.demandLetterExpiryDate)}).`}
            </span>
          </div>
        )}

        {lowSalary && (
          <div className="flex items-start gap-2 px-4 py-2.5 mb-4 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>Low salary warning.</strong> Basic salary {formatNPR(salaryUSD)}/mo
              (≈ {formatNPR(salaryNPR)}/mo) is below Nepal minimum wage of {formatNPR(NEPAL_MINIMUM_WAGE)}/mo.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">

            <PanelCard
              title="Demand details"
              action={
                <div className="relative">
                  <select
                    value={currentDemand.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 pr-7 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="active">Active</option>
                    <option value="filled">Filled</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <InfoRow icon={MapPin}   label="Country" value={currentDemand.employerCountry} />
                <InfoRow icon={MapPin}   label="City" value={currentDemand.employerCity} />
                <InfoRow icon={Briefcase} label="Job category" value={currentDemand.jobCategory} />
                <InfoRow icon={Briefcase} label="Total positions" value={total} />
                <InfoRow icon={Calendar} label="Demand letter date" value={fmtDate(currentDemand.demandLetterDate)} />
                <InfoRow icon={Calendar} label="Expiry date" value={fmtDate(currentDemand.demandLetterExpiryDate)} />
                <InfoRow label="Filled positions" value={filled} />
                <InfoRow label="Basic salary" value={`${formatNPR(salaryUSD)}/mo`} />
              </div>
              {currentDemand.notes && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentDemand.notes}</p>
                </div>
              )}
            </PanelCard>

            <PanelCard
              title={`Assigned candidates (${currentDemand.assignedCandidates?.length || 0})`}
              action={
                <button
                  onClick={loadMatchingPassports}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  + Assign from pool
                </button>
              }
            >
              {!currentDemand.assignedCandidates?.length ? (
                <p className="text-sm text-gray-400 py-6 text-center">No candidates assigned yet.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {currentDemand.assignedCandidates.map(c => (
                    <li key={c._id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/candidates/${c._id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors truncate block"
                        >
                          {c.fullName || c.name}
                        </Link>
                        {c.passportNumber && (
                          <p className="text-xs font-mono text-gray-500 mt-0.5">{c.passportNumber}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setCandidateToRemove(c._id)}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <PanelCard title="Employer info">
              <div>
                <InfoRow icon={Building2} label="Company" value={currentDemand.employerCompanyName} />
                <InfoRow icon={Building2} label="Short code" value={currentDemand.shortCompanyCode} />
                <InfoRow                  label="Contact person" value={currentDemand.employerContactPerson} />
                <InfoRow icon={Phone}     label="Phone" value={currentDemand.employerPhone} />
                <InfoRow icon={Mail}      label="Email" value={currentDemand.employerEmail} />
              </div>
            </PanelCard>

            <PanelCard title="Documents">
              {(() => {
                const docs = [
                  { key: 'demandLetter',     label: 'Demand letter' },
                  { key: 'powerOfAttorney',  label: 'Power of attorney' },
                  { key: 'embassyAttested',  label: 'Embassy attested' },
                ].filter(d => currentDemand[d.key]);
                if (!docs.length) {
                  return <p className="text-sm text-gray-400 py-3 text-center">No documents uploaded.</p>;
                }
                return (
                  <ul className="space-y-1.5">
                    {docs.map(d => (
                      <li key={d.key}>
                        <a
                          href={`/uploads/demands/${currentDemand[d.key]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <FileText size={13} /> {d.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </PanelCard>
          </div>
        </div>
      </div>

      {/* ─── Modals & dialogs ──────────────────────────────────────────── */}

      <AssignPassportModal
        open={showAssignModal}
        onClose={() => { setShowAssignModal(false); setMatchingPassports([]); }}
        passports={matchingPassports}
        loading={loadingPassports}
        onAssign={handleAssign}
        allocatingId={allocatingPassportId}
      />

      <EditDemandModal
        demand={currentDemand}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        saving={savingEdit}
        errors={editErrors}
      />

      <ConfirmDialog
        isOpen={Boolean(candidateToRemove)}
        title="Remove Candidate"
        message="Are you sure you want to remove this candidate from the demand?"
        confirmLabel="Remove"
        confirmVariant="warning"
        onCancel={() => setCandidateToRemove(null)}
        onConfirm={handleRemove}
      />

      <ConfirmDialog
        isOpen={showStatusConfirm}
        title="Change Demand Status"
        message={`Change status from "${currentDemand?.status}" to "${statusToChange}"?`}
        confirmLabel="Change status"
        confirmVariant="warning"
        onCancel={() => { setShowStatusConfirm(false); setStatusToChange(null); }}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
};

export default DemandDetail;
