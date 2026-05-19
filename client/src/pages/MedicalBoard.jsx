import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { medicalApi } from '../api/medical.api';
import { useBulkSelect } from '../hooks/useBulkSelect';
import {
  Stethoscope, RefreshCw, CheckCircle2, XCircle, Clock,
  AlertCircle, ChevronRight, AlertTriangle
} from 'lucide-react';

// ─── Static maps ──────────────────────────────────────────────────────────────

const MEDICAL_TYPE_LABEL = { gamca: 'GAMCA', wafid: 'WAFID', other: 'Other' };

const RESULT_COLOR = {
  pending:  'bg-yellow-50 text-yellow-700',
  fit:      'bg-green-50 text-green-700',
  unfit:    'bg-red-50 text-red-700',
  on_hold:  'bg-orange-50 text-orange-700'
};

const RESULT_LABEL = { pending: 'Pending', fit: 'Fit', unfit: 'Unfit', on_hold: 'On Hold' };

const COUNTRY_EMOJI = {
  'Saudi Arabia': '🇸🇦', 'UAE': '🇦🇪', 'Qatar': '🇶🇦',
  'Kuwait': '🇰🇼', 'Bahrain': '🇧🇭', 'Oman': '🇴🇲', 'Malaysia': '🇲🇾'
};

const TABS = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'fit',       label: 'Fit' },
  { id: 'unfit',     label: 'Unfit' },
  { id: 'onHold',    label: 'On Hold' },
  { id: 'expiring',  label: 'Expiring' }
];

function daysUntil(date) {
  return date ? Math.floor((new Date(date) - Date.now()) / 86400000) : null;
}

function ExpiryBadge({ date }) {
  const d = daysUntil(date);
  if (d === null) return null;
  if (d < 0)  return <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired {-d}d ago</span>;
  if (d <= 30) return <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{d}d left</span>;
  return null;
}

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkBar({ count, onResult, loading, onClear }) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="w-px h-4 bg-gray-600" />
      <button onClick={() => onResult('fit')}     disabled={loading} className="text-sm px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg disabled:opacity-50 transition-colors">Mark Fit</button>
      <button onClick={() => onResult('unfit')}   disabled={loading} className="text-sm px-3 py-1.5 bg-red-500 hover:bg-red-400 rounded-lg disabled:opacity-50 transition-colors">Mark Unfit</button>
      <button onClick={() => onResult('on_hold')} disabled={loading} className="text-sm px-3 py-1.5 bg-orange-500 hover:bg-orange-400 rounded-lg disabled:opacity-50 transition-colors">On Hold</button>
      {loading && <span className="text-xs text-gray-400 animate-pulse">Saving…</span>}
      <button onClick={onClear} className="text-gray-400 hover:text-white ml-1 text-sm">✕</button>
    </div>
  );
}

// ─── Medical row ──────────────────────────────────────────────────────────────

function MedicalRow({ record, isSelected, onToggle }) {
  const c = record.candidate;
  const flag = COUNTRY_EMOJI[c?.desiredCountry] || '🌍';
  const expDays = daysUntil(record.reportExpiryDate);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${isSelected ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(record._id)}
        className="rounded border-gray-300 text-primary accent-primary w-4 h-4 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{c?.fullName || 'Unknown'}</span>
          <span className="text-xs text-gray-400">{flag} {c?.desiredCountry}</span>
          <span className="text-xs text-gray-400">{MEDICAL_TYPE_LABEL[record.medicalType] || '—'}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-400">
          {record.medicalCenter && <span>{record.medicalCenter}</span>}
          {record.scheduledDate && <span>Sch: {new Date(record.scheduledDate).toLocaleDateString()}</span>}
          {record.conductedDate && <span>Done: {new Date(record.conductedDate).toLocaleDateString()}</span>}
          {record.reportExpiryDate && <span>Exp: {new Date(record.reportExpiryDate).toLocaleDateString()}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ExpiryBadge date={record.reportExpiryDate} />
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${RESULT_COLOR[record.result] || 'bg-gray-100 text-gray-600'}`}>
          {RESULT_LABEL[record.result] || record.result}
        </span>
        {c?._id && (
          <Link to={`/candidates/${c._id}`} className="text-gray-300 hover:text-primary transition-colors">
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MedicalBoard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState('scheduled');
  const [bulkLoading, setBulkLoading] = useState(false);
  const { selectedIds, count, toggle, selectAll, clearAll, isSelected } = useBulkSelect();

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await medicalApi.getBoard();
      setData(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load medical board');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeRows = data?.[activeTab] || [];

  const handleBulkResult = async (result) => {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    try {
      await medicalApi.bulkResult(selectedIds, result);
      clearAll();
      await fetchData(true);
    } catch (e) {
      alert(e.response?.data?.message || 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
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

  const { scheduled = [], fit = [], unfit = [], onHold = [], expiring = [], total = 0 } = data || {};
  const tabCount = { scheduled: scheduled.length, fit: fit.length, unfit: unfit.length, onHold: onHold.length, expiring: expiring.length };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 rounded-lg"><Stethoscope size={20} className="text-cyan-600" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Medical Examination Board</h1>
              <p className="text-sm text-gray-400">
                {total} active · GAMCA / WAFID / FOMEMA
                {expiring.length > 0 && <span className="ml-2 text-orange-600 font-medium">· {expiring.length} expiring soon</span>}
              </p>
            </div>
          </div>
          <button onClick={() => fetchData(true)} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); clearAll(); }}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {tabCount[tab.id]}
              </span>
            </button>
          ))}
          {/* Select all */}
          {activeRows.length > 0 && (
            <button
              onClick={() => count === activeRows.length ? clearAll() : selectAll(activeRows.map(r => ({ _id: r._id })))}
              className="ml-auto text-xs text-gray-500 hover:text-primary px-2 py-1 rounded whitespace-nowrap"
            >
              {count === activeRows.length ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-2 pb-24">
        {activeTab === 'expiring' && expiring.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 mb-2">
            <AlertTriangle size={16} className="shrink-0" />
            These candidates have fit medical results but their reports expire within 30 days.
          </div>
        )}

        {activeRows.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <CheckCircle2 size={32} className="text-gray-300" />
            <p className="text-sm text-gray-400">No records in this category</p>
          </div>
        ) : (
          activeRows.map(record => (
            <MedicalRow
              key={record._id}
              record={record}
              isSelected={isSelected(record._id)}
              onToggle={toggle}
            />
          ))
        )}
      </div>

      <BulkBar count={count} onResult={handleBulkResult} loading={bulkLoading} onClear={clearAll} />
    </div>
  );
};

export default MedicalBoard;
