import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orientationApi } from '../../api/orientation.api';
import { useBulkSelect } from '../../hooks/useBulkSelect';
import {
  GraduationCap, RefreshCw, CheckCircle2, AlertCircle,
  ChevronRight, Users, FileWarning
} from 'lucide-react';

// ─── Static maps ──────────────────────────────────────────────────────────────

const COMPLETION_COLOR = {
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  absent:    'bg-red-50 text-red-700',
  failed:    'bg-gray-100 text-gray-600'
};

const COMPLETION_LABEL = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  absent:    'Absent',
  failed:    'Failed'
};

const TABS = [
  { id: 'upcoming',    label: 'Upcoming' },
  { id: 'missingCert', label: 'Missing Cert' },
  { id: 'completed',   label: 'Completed' },
  { id: 'absent',      label: 'Absent' }
];

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkBar({ count, onStatus, loading, onClear, activeTab }) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="w-px h-4 bg-gray-600" />
      {(activeTab === 'upcoming' || activeTab === 'missingCert') && (
        <button onClick={() => onStatus('completed')} disabled={loading}
          className="text-sm px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg disabled:opacity-50 transition-colors">
          Mark Completed
        </button>
      )}
      {activeTab === 'upcoming' && (
        <button onClick={() => onStatus('absent')} disabled={loading}
          className="text-sm px-3 py-1.5 bg-red-500 hover:bg-red-400 rounded-lg disabled:opacity-50 transition-colors">
          Mark Absent
        </button>
      )}
      {loading && <span className="text-xs text-gray-400 animate-pulse">Saving…</span>}
      <button onClick={onClear} className="text-gray-400 hover:text-white ml-1 text-sm">✕</button>
    </div>
  );
}

// ─── Orientation row ──────────────────────────────────────────────────────────

function OrientationRow({ record, isSelected, onToggle, showCertWarning }) {
  const c = record.candidate;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
      isSelected ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-100 hover:border-gray-200'
    }`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(record._id)}
        className="rounded border-gray-300 text-primary accent-primary w-4 h-4 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{c?.fullName || 'Unknown'}</span>
          {c?.desiredCountry && <span className="text-xs text-gray-400">{c.desiredCountry}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-400">
          {record.trainingCenter && <span>{record.trainingCenter}</span>}
          {record.startDate && <span>Start: {new Date(record.startDate).toLocaleDateString()}</span>}
          {record.endDate   && <span>End: {new Date(record.endDate).toLocaleDateString()}</span>}
          {record.batchNumber && <span>Batch: {record.batchNumber}</span>}
          {record.certificateNumber && <span className="text-green-600">Cert: {record.certificateNumber}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {showCertWarning && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
            <FileWarning size={11} /> No cert
          </span>
        )}
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${COMPLETION_COLOR[record.completionStatus] || 'bg-gray-100 text-gray-600'}`}>
          {COMPLETION_LABEL[record.completionStatus] || record.completionStatus}
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

// ─── Batch group (for upcoming tab) ──────────────────────────────────────────

function BatchGroup({ batch, isSelected, onToggle, onBulkBatch, bulkLoading }) {
  const [collapsed, setCollapsed] = useState(false);
  const label = batch.batchNumber || 'No batch number';
  const allIds = batch.orientations.map(o => o._id?.toString());

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <GraduationCap size={16} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-800 text-sm">{label}</span>
          {batch.trainingCenter && <span className="text-xs text-gray-400 ml-2">· {batch.trainingCenter}</span>}
          {batch.startDate && <span className="text-xs text-gray-400 ml-2">· {new Date(batch.startDate).toLocaleDateString()} – {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : '?'}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs text-gray-500"><Users size={12} />{batch.orientations.length}</span>
          <button
            onClick={() => onBulkBatch(allIds, 'completed')}
            disabled={bulkLoading}
            className="text-xs px-2.5 py-1 bg-green-500 text-white rounded-lg hover:bg-green-400 disabled:opacity-50 transition-colors"
          >
            All Completed
          </button>
          <button
            onClick={() => onBulkBatch(allIds, 'absent')}
            disabled={bulkLoading}
            className="text-xs px-2.5 py-1 bg-red-500 text-white rounded-lg hover:bg-red-400 disabled:opacity-50 transition-colors"
          >
            All Absent
          </button>
          <button onClick={() => setCollapsed(c => !c)} className="text-xs text-gray-400 hover:text-gray-600 px-1">
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-2">
          {batch.orientations.map(o => (
            <OrientationRow key={o._id} record={o} isSelected={isSelected(o._id)} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const OrientationBoard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState('upcoming');
  const [bulkLoading, setBulkLoading] = useState(false);
  const { selectedIds, count, toggle, selectAll, clearAll, isSelected } = useBulkSelect();

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await orientationApi.getBoard();
      setData(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load orientation board');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBulkStatus = async (status, ids) => {
    const targetIds = ids || selectedIds;
    if (!targetIds.length) return;
    setBulkLoading(true);
    try {
      await orientationApi.bulkStatus(targetIds, status);
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
          <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
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

  const { upcoming = [], completed = [], absent = [], missingCert = [], batchGroups = [], total = 0 } = data || {};
  const tabCount = { upcoming: upcoming.length, missingCert: missingCert.length, completed: completed.length, absent: absent.length };
  const activeRows = data?.[activeTab] || [];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg"><GraduationCap size={20} className="text-violet-600" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pre-Departure Orientation Board</h1>
              <p className="text-sm text-gray-400">
                {total} active · PDOT sessions
                {missingCert.length > 0 && <span className="ml-2 text-orange-600 font-medium">· {missingCert.length} missing certificates</span>}
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
        {/* Upcoming tab: show batch groups */}
        {activeTab === 'upcoming' && batchGroups.length > 0 ? (
          <>
            {batchGroups.map((batch, i) => (
              <BatchGroup
                key={batch.batchNumber || i}
                batch={batch}
                isSelected={isSelected}
                onToggle={toggle}
                onBulkBatch={handleBulkStatus}
                bulkLoading={bulkLoading}
              />
            ))}
          </>
        ) : activeRows.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <CheckCircle2 size={32} className="text-gray-300" />
            <p className="text-sm text-gray-400">No records in this category</p>
          </div>
        ) : (
          activeRows.map(record => (
            <OrientationRow
              key={record._id}
              record={record}
              isSelected={isSelected(record._id)}
              onToggle={toggle}
              showCertWarning={activeTab === 'missingCert'}
            />
          ))
        )}
      </div>

      <BulkBar
        count={count}
        onStatus={handleBulkStatus}
        loading={bulkLoading}
        onClear={clearAll}
        activeTab={activeTab}
      />
    </div>
  );
};

export default OrientationBoard;
