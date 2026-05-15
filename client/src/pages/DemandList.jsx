import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useJobDemands } from '../hooks/useJobDemands';
import AddDemandModal from '../components/AddDemandModal';
import Pagination from '../components/ui/Pagination';
import {
  COUNTRY_FLAGS, DEMAND_STATUS_COLORS, DEMAND_STATUS_LABELS, DESIRED_COUNTRIES
} from '../utils/constants';
import {
  Briefcase, Plus, RefreshCw, AlertCircle, AlertTriangle, ChevronDown, X
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const daysUntil = (d) => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;

function stackReason(demand) {
  if (demand.status === 'filled')    return { label: 'Fulfilled', cls: 'bg-emerald-100 text-emerald-700' };
  if (demand.status === 'expired')   return { label: 'Expired',   cls: 'bg-amber-100 text-amber-700' };
  if (demand.status === 'cancelled') return { label: 'Cancelled', cls: 'bg-red-100 text-red-700' };
  if (Number(demand.filledPositions) > 0 &&
      Number(demand.filledPositions) < Number(demand.totalPositions)) {
    return { label: 'Partial', cls: 'bg-blue-100 text-blue-700' };
  }
  return { label: 'Completed', cls: 'bg-gray-100 text-gray-700' };
}

// ─── Demand card ──────────────────────────────────────────────────────────────

function DemandCard({ demand, showStackTag }) {
  const days       = daysUntil(demand.demandLetterExpiryDate);
  const isExpired  = days !== null && days <= 0;
  const isExpiring = days !== null && days > 0 && days <= 30;
  const filled     = Number(demand.filledPositions) || 0;
  const total      = Number(demand.totalPositions)  || 0;
  const pct        = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;

  const accent =
    isExpired   ? 'border-l-red-500'   :
    isExpiring  ? 'border-l-amber-500' :
                  'border-l-emerald-500';

  return (
    <Link
      to={`/demands/${demand._id}`}
      className={`bg-white rounded-xl border border-gray-100 border-l-4 ${accent} p-4 hover:shadow-md hover:border-gray-200 transition-all`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h3 className="text-base font-semibold text-gray-900 leading-tight truncate flex-1">
          {demand.employerCompanyName || 'Unnamed employer'}
        </h3>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${DEMAND_STATUS_COLORS[demand.status] || 'bg-gray-100 text-gray-700'}`}>
            {DEMAND_STATUS_LABELS[demand.status] || demand.status}
          </span>
          {showStackTag && (
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${stackReason(demand).cls}`}>
              {stackReason(demand).label}
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span>
          {COUNTRY_FLAGS[demand.employerCountry] || '🌍'} {demand.employerCountry || 'Unknown country'}
          {demand.employerCity && <span className="text-gray-400"> · {demand.employerCity}</span>}
        </span>
        {demand.shortCompanyCode && (
          <span className="text-gray-400">· Code {demand.shortCompanyCode}</span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3 truncate">
        {demand.jobCategory || 'Various positions'}
      </p>

      <div className="mb-2">
        <div className="flex items-baseline justify-between text-xs mb-1">
          <span className="text-gray-400 uppercase tracking-wide">Slots filled</span>
          <span className="font-semibold text-gray-700">{filled}/{total}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {demand.demandLetterExpiryDate && (
        <p className={`text-[11px] ${isExpired ? 'text-red-600 font-semibold' : isExpiring ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
          {isExpired
            ? `Expired ${-days}d ago`
            : `Expires ${fmtDate(demand.demandLetterExpiryDate)} · ${days}d left`}
        </p>
      )}
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DemandList = () => {
  const { demands, loading, pagination, getDemands, getExpiring, expiringDemands, error } = useJobDemands();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter]   = useState(searchParams.get('status') || '');
  const [countryFilter, setCountryFilter] = useState(searchParams.get('country') || '');
  const [viewMode, setViewMode]           = useState(searchParams.get('view') || 'all');
  const [currentPage, setCurrentPage]     = useState(Math.max(1, parseInt(searchParams.get('page') || '1', 10)));
  const [pageSize, setPageSize]           = useState(
    [10, 20, 50].includes(parseInt(searchParams.get('limit') || '20', 10))
      ? parseInt(searchParams.get('limit') || '20', 10)
      : 20
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const buildParams = (page = 1, overrides = {}) => ({
    page,
    limit:   overrides.limit   !== undefined ? overrides.limit   : pageSize,
    status:  (overrides.status  !== undefined ? overrides.status  : statusFilter)  || undefined,
    country: (overrides.country !== undefined ? overrides.country : countryFilter) || undefined,
  });

  // Persist filter state in the URL
  useEffect(() => {
    const params = {};
    if (statusFilter)        params.status  = statusFilter;
    if (countryFilter)       params.country = countryFilter;
    if (viewMode !== 'all')  params.view    = viewMode;
    if (currentPage > 1)     params.page    = String(currentPage);
    if (pageSize !== 20)     params.limit   = String(pageSize);
    setSearchParams(params, { replace: true });
  }, [statusFilter, countryFilter, viewMode, currentPage, pageSize, setSearchParams]);

  useEffect(() => {
    getDemands(buildParams(currentPage));
  }, [statusFilter, countryFilter, currentPage, pageSize, getDemands]);

  useEffect(() => { getExpiring(); }, [getExpiring]);

  const handleDemandCreated = () => {
    getDemands(buildParams(currentPage));
    getExpiring();
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilter(''); setCountryFilter(''); setViewMode('all');
    setCurrentPage(1);
  };

  const displayedDemands = viewMode === 'stack'
    ? demands.filter((d) =>
        d.status === 'filled' || d.status === 'expired' || d.status === 'cancelled' ||
        (Number(d.filledPositions) > 0 && Number(d.filledPositions) < Number(d.totalPositions))
      )
    : demands;

  const hasFilters = !!(statusFilter || countryFilter || viewMode === 'stack');

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Briefcase size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Job Demands</h1>
              <p className="text-sm text-gray-400">
                {pagination?.total ?? '—'} total
                {hasFilters && <span className="ml-1 text-primary">· filtered</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => getDemands(buildParams(currentPage))}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={14} /> Add Demand
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <select
              value={viewMode}
              onChange={(e) => { setViewMode(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none border border-gray-200 rounded-lg text-sm px-3 py-1.5 pr-8 text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
            >
              <option value="all">All demands</option>
              <option value="stack">Stack list (filled / partial / expired)</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
              className="w-full appearance-none border border-gray-200 rounded-lg text-sm px-3 py-1.5 pr-8 text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="filled">Filled</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
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

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-3">

        {expiringDemands?.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              <strong>{expiringDemands.length}</strong> demand{expiringDemands.length !== 1 ? 's' : ''} expiring within 14 days.
            </span>
          </div>
        )}

        {loading && demands.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xl border border-gray-100">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm text-gray-600">{error}</p>
            <button onClick={() => getDemands(buildParams(currentPage))} className="text-sm text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : displayedDemands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-xl border border-gray-100">
            <Briefcase size={32} className="text-gray-300" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {hasFilters ? 'No matches found' : 'No demands yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                {viewMode === 'stack'
                  ? 'No fulfilled, partial, expired or cancelled demands in the stack list.'
                  : hasFilters
                    ? 'Try adjusting your filters.'
                    : 'Start by adding your first job demand from an overseas employer.'}
              </p>
            </div>
            {hasFilters
              ? <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear filters</button>
              : <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-700"
                >
                  <Plus size={12} /> Add First Demand
                </button>
            }
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${loading ? 'opacity-60' : ''}`}>
            {displayedDemands.map(d => (
              <DemandCard key={d._id} demand={d} showStackTag={viewMode === 'stack'} />
            ))}
          </div>
        )}

        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          pageSize={pageSize}
          onPageChange={(next) => setCurrentPage(next)}
          onPageSizeChange={(nextSize) => { setPageSize(nextSize); setCurrentPage(1); }}
        />
      </div>

      {showAddModal && (
        <AddDemandModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleDemandCreated} />
      )}
    </div>
  );
};

export default DemandList;
