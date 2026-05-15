import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { countryModulesApi } from '../../api/countryModules.api';
import {
  Sun, RefreshCw, ChevronRight, ChevronDown, CheckCircle2,
  XCircle, Clock, AlertCircle, Stamp, FileText
} from 'lucide-react';

// ─── Static maps ──────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  calling_visa_pending:   'Calling Visa Pending',
  calling_visa_received:  'Calling Visa Received',
  visa_applied:           'Applied to Embassy',
  visa_stamped:           'Visa Stamped',
  visa_rejected:          'Visa Rejected'
};

const STATUS_COLOR = {
  calling_visa_pending:  'bg-yellow-50 text-yellow-700',
  calling_visa_received: 'bg-blue-50 text-blue-700',
  visa_applied:          'bg-purple-50 text-purple-700',
  visa_stamped:          'bg-green-50 text-green-700',
  visa_rejected:         'bg-red-50 text-red-700'
};

const GULF_COUNTRIES = ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'];

const COUNTRY_FLAG = {
  'Saudi Arabia': '🇸🇦',
  'UAE':          '🇦🇪',
  'Qatar':        '🇶🇦',
  'Kuwait':       '🇰🇼',
  'Bahrain':      '🇧🇭',
  'Oman':         '🇴🇲'
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-CA') : null;
}

// ─── Inline visa form ─────────────────────────────────────────────────────────

function VisaForm({ row, onSaved }) {
  const [form, setForm] = useState({
    visaNumber:       row.visaNumber || '',
    visaReceivedDate: fmtDate(row.visaReceivedDate) || '',
    visaExpiryDate:   fmtDate(row.visaExpiryDate) || ''
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      await countryModulesApi.updateGulfVisa(row._id, form);
      onSaved(row._id, form);
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] text-gray-500 font-medium block mb-1">Visa Number</label>
          <input
            value={form.visaNumber}
            onChange={e => set('visaNumber', e.target.value)}
            placeholder="e.g. KSA-123456"
            className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 font-medium block mb-1">Received Date</label>
          <input
            type="date"
            value={form.visaReceivedDate}
            onChange={e => set('visaReceivedDate', e.target.value)}
            className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 font-medium block mb-1">Expiry Date</label>
          <input
            type="date"
            value={form.visaExpiryDate}
            onChange={e => set('visaExpiryDate', e.target.value)}
            className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="text-sm px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Candidate row ─────────────────────────────────────────────────────────────

function CandidateRow({ row, onSaved }) {
  const [open, setOpen] = useState(false);
  const flag = COUNTRY_FLAG[row.country] || '🌍';

  return (
    <div className="border border-gray-100 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{row.fullName}</span>
            {row.country && (
              <span className="text-xs text-gray-400">{flag} {row.country}</span>
            )}
            {row.company && (
              <span className="text-xs text-gray-400 truncate">· {row.company}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[row.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[row.status] || row.status}
            </span>
            {row.visaNumber
              ? <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> {row.visaNumber}</span>
              : <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> No visa number</span>
            }
            {row.visaExpiryDate && (
              <span className="text-xs text-gray-400">Exp: {new Date(row.visaExpiryDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/candidates/${row._id}`}
            onClick={e => e.stopPropagation()}
            className="text-xs text-primary hover:underline"
          >
            Open
          </Link>
          {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-50">
          {row.demandLetterNo && (
            <div className="flex gap-4 py-2 text-xs text-gray-500">
              <span>Demand: <strong>{row.demandLetterNo}</strong></span>
              {row.purbaSwukritiNo && <span>Purba Swukriti: <strong>{row.purbaSwukritiNo}</strong></span>}
              {row.passportNumber && <span>Passport: <strong>{row.passportNumber}</strong></span>}
            </div>
          )}
          <VisaForm row={row} onSaved={onSaved} />
        </div>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, iconColor, rows, emptyMsg, onSaved }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
      >
        <Icon size={18} className={iconColor} />
        <span className="font-semibold text-gray-900">{title}</span>
        <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{rows.length}</span>
        <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      {!collapsed && (
        <div className="p-4 space-y-2">
          {rows.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">{emptyMsg}</p>
            : rows.map(r => <CandidateRow key={r._id} row={r} onSaved={onSaved} />)
          }
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const COUNTRY_FILTER_OPTIONS = ['All', ...GULF_COUNTRIES];

const GulfVisaBoard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [countryFilter, setCountryFilter] = useState('All');
  const [search, setSearch]   = useState('');

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await countryModulesApi.getGulfVisaBoard();
      setData(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load Gulf visa board');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterRows = rows => {
    let out = rows;
    if (countryFilter !== 'All') out = out.filter(r => r.country === countryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(r =>
        r.fullName?.toLowerCase().includes(q) ||
        r.company?.toLowerCase().includes(q) ||
        r.visaNumber?.toLowerCase().includes(q)
      );
    }
    return out;
  };

  const handleSaved = (candidateId, updates) => {
    setData(prev => {
      if (!prev) return prev;
      const patch = section => section.map(r => r._id === candidateId ? { ...r, ...updates } : r);
      return {
        ...prev,
        callingVisa:     patch(prev.callingVisa),
        embassyStamping: patch(prev.embassyStamping),
        completed:       patch(prev.completed)
      };
    });
  };

  if (loading) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-600">{error}</p>
        <button onClick={() => fetchData()} className="text-sm text-primary hover:underline">Retry</button>
      </div>
    );
  }

  const { callingVisa = [], embassyStamping = [], completed = [], total = 0 } = data || {};

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Sun size={20} className="text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gulf Visa Stamping Board</h1>
              <p className="text-sm text-gray-400">{total} candidates · Calling visa → Embassy stamping</p>
            </div>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, company, visa number…"
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none w-64"
          />
          <div className="flex gap-1.5 flex-wrap">
            {COUNTRY_FILTER_OPTIONS.map(c => (
              <button
                key={c}
                onClick={() => setCountryFilter(c)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  countryFilter === c
                    ? 'bg-primary text-white'
                    : 'border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                }`}
              >
                {c === 'All' ? 'All countries' : `${COUNTRY_FLAG[c]} ${c}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Pipeline step bar */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3 text-sm overflow-x-auto">
          {[
            { label: 'Calling Visa', count: filterRows(callingVisa).length, color: 'text-yellow-600' },
            { label: '→', count: null, color: 'text-gray-300' },
            { label: 'Embassy', count: filterRows(embassyStamping).length, color: 'text-purple-600' },
            { label: '→', count: null, color: 'text-gray-300' },
            { label: 'Stamped / Rejected', count: filterRows(completed).length, color: 'text-green-600' }
          ].map((s, i) => (
            <span key={i} className={`font-medium whitespace-nowrap ${s.color}`}>
              {s.label}{s.count !== null ? ` (${s.count})` : ''}
            </span>
          ))}
        </div>

        <Section
          title="Calling Visa Stage"
          icon={FileText}
          iconColor="text-yellow-500"
          rows={filterRows(callingVisa)}
          emptyMsg="No candidates awaiting calling visa."
          onSaved={handleSaved}
        />

        <Section
          title="Embassy Stamping"
          icon={Stamp}
          iconColor="text-purple-500"
          rows={filterRows(embassyStamping)}
          emptyMsg="No candidates at embassy stamping stage."
          onSaved={handleSaved}
        />

        <Section
          title="Completed (Stamped / Rejected)"
          icon={CheckCircle2}
          iconColor="text-green-500"
          rows={filterRows(completed)}
          emptyMsg="No completed visa records yet."
          onSaved={handleSaved}
        />
      </div>
    </div>
  );
};

export default GulfVisaBoard;
