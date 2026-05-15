import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe, CheckCircle2, Clock, AlertCircle, Search,
  ExternalLink, ChevronDown, ChevronRight, Save, RefreshCw
} from 'lucide-react';
import feimsApi from '../../api/feims.api.js';
import { STATUS_LABELS, STATUS_COLORS, getCountryFlag } from '../../domain/workflow';
import { showToast } from '../../components/ToastProvider';

const FEIMS_PORTAL = 'https://feims.dofe.gov.np';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return '—'; }
};

// ─── Stat card ────────────────────────────────────────────────────────────────

const STAT_STYLES = {
  ready:      { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  num: 'text-amber-600' },
  submitted:  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   num: 'text-blue-600' },
  registered: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  num: 'text-green-600' },
  approaching:{ bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   num: 'text-gray-500' },
};

const StatCard = ({ label, count, variant, onClick, active }) => {
  const s = STAT_STYLES[variant];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
        active ? `${s.bg} ${s.border}` : 'bg-white border-gray-100 hover:border-gray-200'
      }`}
    >
      <p className={`text-2xl font-bold ${active ? s.num : 'text-gray-700'}`}>{count}</p>
      <p className={`text-xs font-medium mt-0.5 ${active ? s.text : 'text-gray-500'}`}>{label}</p>
    </button>
  );
};

// ─── Inline reg number form ────────────────────────────────────────────────────

const RegForm = ({ candidateId, onSaved, onCancel }) => {
  const [form, setForm]     = useState({ feimsRegistrationNumber: '', dofeFileNumber: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.feimsRegistrationNumber.trim()) return;
    setSaving(true);
    try {
      await feimsApi.updateRegistration(candidateId, {
        feimsRegistrationNumber: form.feimsRegistrationNumber.trim(),
        dofeFileNumber:          form.dofeFileNumber.trim() || undefined,
        feimsSubmittedAt:        new Date().toISOString(),
        feimsApprovalStatus:     'pending'
      });
      showToast.success('FEIMS registration recorded');
      onSaved();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-3">
      <p className="text-xs font-semibold text-gray-600 mb-2">Record FEIMS Registration</p>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">
            FEIMS Reg. Number *
          </label>
          <input
            type="text"
            placeholder="e.g. FEIMS-2081-XXXXXX"
            value={form.feimsRegistrationNumber}
            onChange={e => setForm(f => ({ ...f, feimsRegistrationNumber: e.target.value }))}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">
            DoFE File No. (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. DoFE/081/XXXXX"
            value={form.dofeFileNumber}
            onChange={e => setForm(f => ({ ...f, dofeFileNumber: e.target.value }))}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!form.feimsRegistrationNumber.trim() || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving
              ? <><RefreshCw size={12} className="animate-spin" /> Saving…</>
              : <><Save size={12} /> Save</>
            }
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Candidate row ────────────────────────────────────────────────────────────

const CandidateRow = ({ candidate, variant, showRegForm, onToggleReg, onRegSaved }) => {
  const s = STAT_STYLES[variant];

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          variant === 'registered' ? 'bg-green-500' :
          variant === 'ready'      ? 'bg-amber-400' :
          variant === 'submitted'  ? 'bg-blue-400'  :
                                     'bg-gray-300'
        }`} />

        {/* Candidate info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{candidate.fullName}</span>
            {candidate.country && (
              <span className="text-sm" title={candidate.country}>
                {getCountryFlag(candidate.country)}
              </span>
            )}
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
              STATUS_COLORS[candidate.status] || 'bg-gray-100 text-gray-600'
            }`}>
              {STATUS_LABELS[candidate.status] || candidate.status}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {candidate.demandCompany && (
              <span className="text-xs text-gray-500">{candidate.demandCompany}</span>
            )}
            {candidate.demandLetterNumber && (
              <span className="text-xs text-gray-400">· {candidate.demandLetterNumber}</span>
            )}

            {variant === 'registered' && (
              <span className="text-xs font-medium text-green-700">
                · FEIMS: {candidate.feimsRegistrationNumber}
                {candidate.dofeFileNumber && ` · DoFE: ${candidate.dofeFileNumber}`}
              </span>
            )}

            {variant === 'submitted' && candidate.feimsSubmittedAt && (
              <span className="text-xs text-blue-600">
                · Submitted {fmtDate(candidate.feimsSubmittedAt)}
              </span>
            )}

            {variant === 'approaching' && candidate.missingCount > 0 && (
              <span className="text-xs text-red-500">
                · Missing: {candidate.missingFields.slice(0, 3).join(', ')}
                {candidate.missingFields.length > 3 && ` +${candidate.missingFields.length - 3} more`}
              </span>
            )}

            {candidate.shramSwikritiNumber && (
              <span className="text-xs text-orange-600">
                · Shram: {candidate.shramSwikritiNumber}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to={`/candidates/${candidate._id}`}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Open →
          </Link>

          {(variant === 'ready' || variant === 'submitted') && (
            <button
              onClick={() => onToggleReg(candidate._id)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                showRegForm
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200'
              }`}
            >
              {showRegForm ? 'Cancel' : 'Record Reg#'}
            </button>
          )}
        </div>
      </div>

      {showRegForm && (
        <RegForm
          candidateId={String(candidate._id)}
          onSaved={onRegSaved}
          onCancel={() => onToggleReg(candidate._id)}
        />
      )}
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const Section = ({
  title, icon: Icon, variant, candidates,
  expandedReg, onToggleReg, onRegSaved, defaultOpen = true
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const s = STAT_STYLES[variant];

  if (!candidates?.length) return null;

  return (
    <div className="mb-4 bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <Icon size={14} className={s.text} />
        <span className="text-sm font-semibold text-gray-800 flex-1">{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
          {candidates.length}
        </span>
        {open
          ? <ChevronDown size={13} className="text-gray-400" />
          : <ChevronRight size={13} className="text-gray-400" />
        }
      </button>

      {open && (
        <div className="border-t border-gray-50">
          {candidates.map(c => (
            <CandidateRow
              key={String(c._id)}
              candidate={c}
              variant={variant}
              showRegForm={expandedReg.has(String(c._id))}
              onToggleReg={onToggleReg}
              onRegSaved={onRegSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const FeimsSubmissionCenter = () => {
  const [queue, setQueue]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [expandedReg, setExpandedReg] = useState(new Set());

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await feimsApi.getQueue();
      setQueue(res.data.data || res.data);
    } catch (err) {
      showToast.error('Failed to load FEIMS queue');
    } finally {
      setLoading(false);
    }
  };

  const toggleReg = (candidateId) => {
    setExpandedReg(prev => {
      const next = new Set(prev);
      next.has(candidateId) ? next.delete(candidateId) : next.add(candidateId);
      return next;
    });
  };

  const handleRegSaved = () => {
    setExpandedReg(new Set());
    loadQueue();
  };

  const filterCandidates = (candidates) => {
    if (!candidates) return [];
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(c =>
      c.fullName?.toLowerCase().includes(q) ||
      c.demandCompany?.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q) ||
      c.feimsRegistrationNumber?.toLowerCase().includes(q)
    );
  };

  const ready      = filterCandidates(queue?.ready);
  const submitted  = filterCandidates(queue?.submitted);
  const registered = filterCandidates(queue?.registered);
  const approaching= filterCandidates(queue?.approaching);

  const total = (queue?.ready?.length || 0)
    + (queue?.submitted?.length || 0)
    + (queue?.registered?.length || 0)
    + (queue?.approaching?.length || 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe size={20} className="text-cyan-600" />
            FEIMS Submission Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and submit candidates to the DoFE FEIMS portal
          </p>
        </div>
        <a
          href={FEIMS_PORTAL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <Globe size={14} /> Open DoFE FEIMS <ExternalLink size={12} />
        </a>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Ready to Submit"
          count={queue?.ready?.length ?? '—'}
          variant="ready"
          active={filter === 'ready'}
          onClick={() => setFilter(f => f === 'ready' ? 'all' : 'ready')}
        />
        <StatCard
          label="Awaiting Reg. Number"
          count={queue?.submitted?.length ?? '—'}
          variant="submitted"
          active={filter === 'submitted'}
          onClick={() => setFilter(f => f === 'submitted' ? 'all' : 'submitted')}
        />
        <StatCard
          label="Registered"
          count={queue?.registered?.length ?? '—'}
          variant="registered"
          active={filter === 'registered'}
          onClick={() => setFilter(f => f === 'registered' ? 'all' : 'registered')}
        />
        <StatCard
          label="Approaching"
          count={queue?.approaching?.length ?? '—'}
          variant="approaching"
          active={filter === 'approaching'}
          onClick={() => setFilter(f => f === 'approaching' ? 'all' : 'approaching')}
        />
      </div>

      {/* ── Search + refresh ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, company, country, reg. number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
          />
        </div>
        <button
          onClick={loadQueue}
          disabled={loading}
          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Content ── */}
      {loading && !queue ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading FEIMS queue…</p>
        </div>
      ) : total === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <CheckCircle2 size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No candidates in the FEIMS pipeline yet.</p>
          <Link to="/candidates" className="mt-2 inline-block text-xs text-blue-600 hover:underline">
            Go to candidates →
          </Link>
        </div>
      ) : (
        <>
          {(filter === 'all' || filter === 'ready') && (
            <Section
              title="Ready to Submit"
              icon={AlertCircle}
              variant="ready"
              candidates={ready}
              expandedReg={expandedReg}
              onToggleReg={toggleReg}
              onRegSaved={handleRegSaved}
              defaultOpen
            />
          )}

          {(filter === 'all' || filter === 'submitted') && (
            <Section
              title="Submitted — Awaiting Registration Number"
              icon={Clock}
              variant="submitted"
              candidates={submitted}
              expandedReg={expandedReg}
              onToggleReg={toggleReg}
              onRegSaved={handleRegSaved}
              defaultOpen
            />
          )}

          {(filter === 'all' || filter === 'registered') && (
            <Section
              title="Registered in FEIMS"
              icon={CheckCircle2}
              variant="registered"
              candidates={registered}
              expandedReg={expandedReg}
              onToggleReg={toggleReg}
              onRegSaved={handleRegSaved}
              defaultOpen={false}
            />
          )}

          {(filter === 'all' || filter === 'approaching') && (
            <Section
              title="Approaching — Pre-conditions Needed"
              icon={AlertCircle}
              variant="approaching"
              candidates={approaching}
              expandedReg={expandedReg}
              onToggleReg={toggleReg}
              onRegSaved={handleRegSaved}
              defaultOpen={false}
            />
          )}

          {search && ready.length + submitted.length + registered.length + approaching.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No candidates match "{search}"
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeimsSubmissionCenter;
