import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCandidates } from '../hooks/useCandidates';
import { useAuth } from '../context/AuthContext';
import { candidatesApi, passportPoolApi } from '../api';
import { ConfirmDialog } from '../components/ui';
import { showToast } from '../components/ToastProvider';
import BulkSelectBar from '../components/BulkSelectBar';
import BulkExportModal from '../components/BulkExportModal';
import {
  STAGE_DEFINITIONS,
  STATUS_LABELS,
  STATUS_COLORS,
  getStageForStatus,
  getCountryFlag,
} from '../domain/workflow';
import { DESIRED_COUNTRIES } from '../utils/constants';
import {
  Users, Search, Download, RotateCcw, RefreshCw,
  ChevronLeft, ChevronRight, AlertCircle, ChevronDown, X, CheckSquare,
  Check, Minus, ExternalLink
} from 'lucide-react';

// ─── Filter helpers ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...STAGE_DEFINITIONS.flatMap(stage =>
    stage.statuses.map(s => ({
      value: s,
      label: `${stage.label} — ${STATUS_LABELS[s] || s}`,
    }))
  ),
  { value: 'on_hold',   label: 'Special — On Hold' },
  { value: 'cancelled', label: 'Special — Cancelled' },
];

// ─── Compliance tick cell ─────────────────────────────────────────────────────

function ComplianceTick({ done }) {
  if (done) {
    return (
      <div className="flex justify-center">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50">
          <Check size={13} className="text-emerald-500 stroke-[2.5]" />
        </span>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <Minus size={14} className="text-gray-300" />
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function CandidateRow({ c, index, isAdminOrSuper, reverting, onRevert,
                        selectMode, selected, onToggleSelect }) {
  const stageId  = getStageForStatus(c.status);
  const stage    = STAGE_DEFINITIONS.find(s => s.id === stageId);
  const skill    = c.skills?.[0] || c.desiredJobCategory || '—';
  const country  = c.demandCountry || c.desiredCountry;
  const comp     = c.compliance || {};

  return (
    <tr
      className={`border-b border-gray-100 transition-colors ${
        selected ? 'bg-primary/5' : 'hover:bg-gray-50'
      }`}
    >
      {/* S.No */}
      <td className="px-3 py-3 text-center text-xs text-gray-400 whitespace-nowrap w-10">
        {selectMode ? (
          <label
            onClick={(e) => { e.stopPropagation(); onToggleSelect(c._id); }}
            className="cursor-pointer flex justify-center"
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(c._id)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
            />
          </label>
        ) : (
          index
        )}
      </td>

      {/* Individual */}
      <td className="px-3 py-3">
        <Link to={`/candidates/${c._id}`} className="group flex flex-col gap-0.5">
          <span className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors">
            {c.fullName}
            {country && <span className="ml-1.5 text-sm" title={country}>{getCountryFlag(country)}</span>}
          </span>
          {c.fullNameNepali && (
            <span className="text-[11px] text-gray-400">{c.fullNameNepali}</span>
          )}
          {c.agentName && (
            <span className="text-[11px] text-gray-400">{c.agentName}</span>
          )}
        </Link>
      </td>

      {/* Passport No */}
      <td className="px-3 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">
        {c.passportNumber || '—'}
      </td>

      {/* Skill */}
      <td className="px-3 py-3 text-xs text-gray-600 max-w-[120px]">
        <span className="line-clamp-2 capitalize">{skill}</span>
      </td>

      {/* Status */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[c.status] || c.status}
        </span>
        {stage && (
          <div className="text-[10px] text-gray-400 mt-0.5">{stage.label}</div>
        )}
      </td>

      {/* Orientation */}
      <td className="px-3 py-3" title={comp.orientation ? 'Orientation: Completed' : 'Orientation: Pending'}>
        <ComplianceTick done={comp.orientation} />
      </td>

      {/* Insurance */}
      <td className="px-3 py-3" title={comp.insurance ? 'Insurance: Policy issued' : 'Insurance: Pending'}>
        <ComplianceTick done={comp.insurance} />
      </td>

      {/* Medical */}
      <td className="px-3 py-3" title={comp.medical ? 'Medical: Fit' : 'Medical: Not passed'}>
        <ComplianceTick done={comp.medical} />
      </td>

      {/* Welfare Fund */}
      <td className="px-3 py-3" title={comp.welfare ? 'Welfare Fund: Paid' : 'Welfare Fund: Pending'}>
        <ComplianceTick done={comp.welfare} />
      </td>

      {/* SSF */}
      <td className="px-3 py-3" title={comp.ssf ? 'SSF: Registered' : 'SSF: Pending'}>
        <ComplianceTick done={comp.ssf} />
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center justify-center gap-1">
          <Link
            to={`/candidates/${c._id}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Open candidate"
          >
            <ExternalLink size={13} />
          </Link>
          {isAdminOrSuper && !selectMode && c.status !== 'cancelled' && c.status !== 'registered' && (
            <button
              onClick={() => onRevert(c)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
              title="Revert to passport pool"
            >
              <RotateCcw size={13} className={reverting ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CandidateList = () => {
  const {
    candidates, loading, pagination, getCandidates,
    getAgents, agents, error
  } = useCandidates();
  const { user } = useAuth();

  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [agentFilter, setAgentFilter]     = useState('');
  const [exporting, setExporting]         = useState(false);
  const [revertingId, setRevertingId]     = useState(null);
  const [candidateToRevert, setCandidateToRevert] = useState(null);

  const isAdminOrSuper = user?.role === 'admin' || user?.role === 'superadmin';
  const canExport      = ['admin', 'manager', 'superadmin'].includes(user?.role);

  // Bulk selection
  const [selectMode, setSelectMode]   = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [exportOpen, setExportOpen]   = useState(false);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const loadCandidates = useCallback(async (page = 1) => {
    await getCandidates({
      page,
      search:         search || undefined,
      status:         statusFilter || undefined,
      desiredCountry: countryFilter || undefined,
      agentId:        agentFilter || undefined,
    });
  }, [search, statusFilter, countryFilter, agentFilter, getCandidates]);

  // Initial load
  useEffect(() => { getAgents(); }, []);

  // Reload when dropdown filters change
  useEffect(() => { loadCandidates(1); }, [statusFilter, countryFilter, agentFilter]);

  // Debounced reload on search input — stable debounce not recreated on every render
  useEffect(() => {
    const timer = setTimeout(() => loadCandidates(1), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchChange = (e) => setSearch(e.target.value);

  const handleFilterChange = (setter) => (e) => setter(e.target.value);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCountryFilter('');
    setAgentFilter('');
  };

  const hasFilters = !!(search || statusFilter || countryFilter || agentFilter);

  const confirmRevert = async () => {
    if (!candidateToRevert) return;
    setRevertingId(candidateToRevert._id);
    try {
      const resDetail = await candidatesApi.getById(candidateToRevert._id);
      const pid = resDetail.data.passportId;
      if (!pid) { showToast.error('No passport found for this candidate.'); return; }
      await passportPoolApi.deallocate(pid, 'Manually reverted from Candidate List');
      showToast.success(`${candidateToRevert.fullName} reverted to passport pool.`);
      loadCandidates(pagination.page);
      setCandidateToRevert(null);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to revert passport');
    } finally {
      setRevertingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (statusFilter)  params.status         = statusFilter;
      if (countryFilter) params.desiredCountry = countryFilter;
      if (agentFilter)   params.agentId        = agentFilter;
      if (search)        params.search         = search;
      const response = await candidatesApi.export(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `candidates-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const pageOffset = ((pagination?.page || 1) - 1) * 20;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Candidates</h1>
              <p className="text-sm text-gray-400">
                {pagination?.total ?? '—'} total
                {hasFilters && <span className="ml-1 text-primary">· filtered</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadCandidates(pagination.page || 1)}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            {canExport && (
              selectMode ? (
                <button
                  onClick={exitSelectMode}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <X size={14} /> Cancel
                </button>
              ) : (
                <button
                  onClick={() => setSelectMode(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  title="Pick specific candidates to export"
                >
                  <CheckSquare size={14} /> Select to export
                </button>
              )
            )}
            {isAdminOrSuper && !selectMode && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                title="Export all candidates matching current filters"
              >
                <Download size={14} />
                {exporting ? 'Exporting…' : 'Export filtered'}
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, passport…"
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
              className="w-full appearance-none border border-gray-200 rounded-lg text-sm px-3 py-1.5 pr-8 text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={countryFilter}
              onChange={handleFilterChange(setCountryFilter)}
              className="w-full appearance-none border border-gray-200 rounded-lg text-sm px-3 py-1.5 pr-8 text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
            >
              <option value="">All countries</option>
              {DESIRED_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={agentFilter}
              onChange={handleFilterChange(setAgentFilter)}
              className="w-full appearance-none border border-gray-200 rounded-lg text-sm px-3 py-1.5 pr-8 text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
            >
              <option value="">All agents</option>
              {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className={`px-4 sm:px-6 lg:px-8 py-4 ${selectMode && selectedIds.size > 0 ? 'pb-24' : ''}`}>

        {/* Select-mode context strip */}
        {selectMode && candidates.length > 0 && (() => {
          const pageIds = candidates.map(c => c._id);
          const allOnPageSelected = pageIds.every(id => selectedIds.has(id));
          const someOnPageSelected = pageIds.some(id => selectedIds.has(id));
          const togglePageSelect = () => {
            setSelectedIds(prev => {
              const next = new Set(prev);
              if (allOnPageSelected) pageIds.forEach(id => next.delete(id));
              else                   pageIds.forEach(id => next.add(id));
              return next;
            });
          };
          return (
            <div className="flex items-center justify-between gap-3 px-3 py-2 mb-3 bg-primary/5 border border-primary/20 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <CheckSquare size={13} />
                Pick candidates to export
                <span className="font-normal text-gray-500">· {selectedIds.size} selected</span>
              </div>
              <button
                onClick={togglePageSelect}
                className="font-semibold text-primary hover:underline"
              >
                {allOnPageSelected
                  ? `Deselect ${pageIds.length} on page`
                  : someOnPageSelected
                    ? `Select remaining on page`
                    : `Select all ${pageIds.length} on page`}
              </button>
            </div>
          );
        })()}

        {/* Content */}
        {loading && candidates.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="h-10 bg-gray-50 border-b border-gray-100 animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 border-b border-gray-100 animate-pulse bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xl border border-gray-100">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm text-gray-600">{error}</p>
            <button onClick={() => loadCandidates(pagination.page)} className="text-sm text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xl border border-gray-100">
            <Users size={32} className="text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {hasFilters ? 'No matches found' : 'No candidates yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {hasFilters
                  ? 'Try adjusting your filters or search terms.'
                  : 'Candidates appear here once allocated from the passport pool to a demand.'}
              </p>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${loading ? 'opacity-60' : ''}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 w-10">S.No</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Individual</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">Passport No</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Skill</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">Orientation</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">Insurance</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">Medical</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">Welfare Fund</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">SSF</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => (
                    <CandidateRow
                      key={c._id}
                      c={c}
                      index={pageOffset + i + 1}
                      isAdminOrSuper={isAdminOrSuper}
                      reverting={revertingId === c._id}
                      onRevert={setCandidateToRevert}
                      selectMode={selectMode}
                      selected={selectedIds.has(c._id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination?.pages > 1 && (
          <div className="flex items-center justify-between px-1 pt-3">
            <span className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages}
              {pagination.total != null && <span className="ml-1 text-gray-400">· {pagination.total} total</span>}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => loadCandidates(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => loadCandidates(pagination.page + 1)}
                disabled={pagination.page === pagination.pages || loading}
                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(candidateToRevert)}
        title="Revert to Passport Pool"
        message={`Are you sure you want to revert ${candidateToRevert?.fullName || 'this candidate'} back to the passport pool?`}
        confirmLabel="Revert"
        confirmVariant="warning"
        onCancel={() => setCandidateToRevert(null)}
        onConfirm={confirmRevert}
      />

      {canExport && selectMode && (
        <BulkSelectBar
          count={selectedIds.size}
          onClear={clearSelection}
          onExport={() => setExportOpen(true)}
        />
      )}

      {canExport && exportOpen && (
        <BulkExportModal
          isOpen={exportOpen}
          onClose={() => { setExportOpen(false); exitSelectMode(); }}
          selectedIds={[...selectedIds]}
        />
      )}
    </div>
  );
};

export default CandidateList;
