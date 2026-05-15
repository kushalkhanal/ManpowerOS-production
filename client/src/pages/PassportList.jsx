import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePassports } from '../hooks/usePassports';
import AddPassportModal from '../components/AddPassportModal';
import AllocationModal from '../components/AllocationModal';
import Pagination from '../components/ui/Pagination';
import { NEPAL_DISTRICTS } from '../utils/nepalDistricts';
import { ConfirmDialog } from '../components/ui';
import { showToast } from '../components/ToastProvider';
import {
  Search, BookOpen, Plus, Camera, PenLine, AlertTriangle,
  MoreVertical, ArrowRight, Trash2, Eye, ChevronDown, SlidersHorizontal,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CUSTODY_COLORS = {
  with_agency:           'bg-blue-100 text-blue-700',
  returned_to_candidate: 'bg-emerald-100 text-emerald-700',
  submitted_embassy:     'bg-amber-100 text-amber-700',
  lost:                  'bg-red-100 text-red-700',
};

const CUSTODY_LABELS = {
  with_agency:           'With Agency',
  returned_to_candidate: 'Returned',
  submitted_embassy:     'At Embassy',
  lost:                  'Lost',
};

const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pool',      label: 'Pool',      allocationStatus: 'in_pool'   },
  { key: 'allocated', label: 'Allocated', allocationStatus: 'allocated' },
  { key: 'expiring',  label: 'Expiring',  expiring: true                },
  { key: 'lost',      label: 'Lost',      status: 'lost'                },
];

const PAGE_SIZE = 20;

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const daysUntil = (d) => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;

// ─── Row card ─────────────────────────────────────────────────────────────────

function PassportRow({ passport, onAllocate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const expDays    = daysUntil(passport.expiryDate);
  const isExpiring = expDays !== null && expDays > 0 && expDays <= 60;
  const isExpired  = expDays !== null && expDays <= 0;
  const isPool     = passport.allocationStatus !== 'allocated';

  return (
    <div className="border border-gray-100 rounded-xl px-4 py-3 bg-white hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-4">
        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/passports/${passport._id}`}
              className="text-sm font-semibold text-gray-900 hover:text-primary"
            >
              {passport.fullName}
            </Link>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              CUSTODY_COLORS[passport.custodyStatus] || 'bg-gray-100 text-gray-600'
            }`}>
              {CUSTODY_LABELS[passport.custodyStatus] || passport.custodyStatus}
            </span>
            {isPool ? (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Pool
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                Allocated
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0 mt-0.5 text-xs text-gray-400">
            <span className="font-mono">{passport.passportNumber}</span>
            {(passport.districtOfOrigin || passport.issuedDistrict) && (
              <span>{passport.districtOfOrigin || passport.issuedDistrict}</span>
            )}
            {passport.age && <span>{passport.age}y</span>}
            {passport.gender && <span className="capitalize">{passport.gender}</span>}
          </div>

          {passport.candidateId && (
            <p className="mt-0.5 text-[11px] text-gray-400">
              <span className="text-gray-300 mr-1">→</span>
              <Link
                to={`/candidates/${passport.candidateId._id}`}
                className="hover:text-primary transition-colors"
              >
                {passport.candidateId.fullName}
              </Link>
            </p>
          )}
        </div>

        {/* Expiry */}
        <div className="hidden sm:block text-right shrink-0">
          <p className={`text-xs font-medium ${
            isExpired ? 'text-red-600' : isExpiring ? 'text-amber-600' : 'text-gray-400'
          }`}>
            {isExpired
              ? `Expired ${-expDays}d ago`
              : isExpiring
                ? `Exp in ${expDays}d`
                : `Exp ${fmt(passport.expiryDate)}`}
          </p>
          {passport.expiryDateBS && (
            <p className="text-[11px] text-gray-300 mt-0.5">{passport.expiryDateBS}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isPool && (
            <button
              onClick={() => onAllocate(passport)}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2"
            >
              Allocate <ArrowRight size={11} />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 text-xs">
                {isPool && (
                  <button
                    onClick={() => { setMenuOpen(false); onAllocate(passport); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-primary hover:bg-primary/5"
                  >
                    <ArrowRight size={12} /> Allocate
                  </button>
                )}
                <Link
                  to={`/passports/${passport._id}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                >
                  <Eye size={12} /> View
                </Link>
                <Link
                  to={`/passports/${passport._id}?edit=true`}
                  className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                >
                  <PenLine size={12} /> Edit
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(passport._id); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PassportList = () => {
  const {
    passports, loading, pagination,
    getPassports, getExpiringPassports,
    deletePassport,
  } = usePassports();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // All filter state in one object so a single effect drives the API call
  const [qs, setQs] = useState({
    search:              searchParams.get('search')              || '',
    tab:                 searchParams.get('tab')                 || 'all',
    gender:              searchParams.get('gender')              || '',
    district:            searchParams.get('district')            || '',
    passportValidMonths: searchParams.get('passportValidMonths') || '',
    page:                Math.max(1, Number(searchParams.get('page')) || 1),
  });

  const [filtersOpen,    setFiltersOpen]    = useState(false);
  const [addMenuOpen,    setAddMenuOpen]    = useState(false);
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [allocPassport,  setAllocPassport]  = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [expiringCount,  setExpiringCount]  = useState(0);
  const [expiringList,   setExpiringList]   = useState(null); // null = use hook list; array = override for Expiring tab

  // Load passports whenever qs changes
  useEffect(() => {
    const tab = FILTER_TABS.find(t => t.key === qs.tab) || FILTER_TABS[0];
    if (tab.expiring) {
      getExpiringPassports()
        .then(list => setExpiringList(list || []))
        .catch(() => setExpiringList([]));
    } else {
      setExpiringList(null);
      getPassports({
        page:                qs.page,
        limit:               PAGE_SIZE,
        search:              qs.search              || undefined,
        allocationStatus:    tab.allocationStatus   || undefined,
        status:              tab.status             || undefined,
        gender:              qs.gender              || undefined,
        district:            qs.district            || undefined,
        passportValidMonths: qs.passportValidMonths || undefined,
      });
    }
    // sync URL
    const p = {};
    if (qs.search)               p.search   = qs.search;
    if (qs.tab && qs.tab !== 'all') p.tab    = qs.tab;
    if (qs.gender)               p.gender   = qs.gender;
    if (qs.district)             p.district = qs.district;
    if (qs.passportValidMonths)  p.passportValidMonths = qs.passportValidMonths;
    if (qs.page > 1)             p.page     = String(qs.page);
    setSearchParams(p, { replace: true });
  }, [qs]);

  // Expiring count for banner (one-shot on mount)
  useEffect(() => {
    getExpiringPassports()
      .then(list => setExpiringCount(list?.length || 0))
      .catch(() => {});
  }, []);

  const patch = (changes) => setQs(q => ({ ...q, ...changes, page: 1 }));

  const handleDelete = (id) => setDeleteTargetId(id);
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePassport(deleteTargetId);
      setDeleteTargetId(null);
      setQs(q => ({ ...q })); // re-trigger effect
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete passport');
    } finally {
      setDeleting(false);
    }
  };

  const activeFiltersCount = [qs.gender, qs.district, qs.passportValidMonths].filter(Boolean).length;

  return (
    <div className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      {/* Expiring banner — clickable shortcut to the Expiring tab */}
      {expiringCount > 0 && qs.tab !== 'expiring' && (
        <button
          onClick={() => patch({ tab: 'expiring' })}
          className="w-full mb-4 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors text-left"
        >
          <AlertTriangle size={14} className="shrink-0" />
          {expiringCount} passport{expiringCount === 1 ? '' : 's'} expiring within 60 days — click to view
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Passport Pool</h1>
          {pagination?.total != null && (
            <p className="text-xs text-gray-400 mt-0.5">
              {pagination.total} passport{pagination.total === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setAddMenuOpen(o => !o)}
            onBlur={() => setTimeout(() => setAddMenuOpen(false), 150)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Add <ChevronDown size={12} />
          </button>
          {addMenuOpen && (
            <div className="absolute right-0 top-10 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 text-sm">
              <button
                onClick={() => { setAddMenuOpen(false); navigate('/passport/scanner'); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                <Camera size={13} /> Scan Passport
              </button>
              <button
                onClick={() => { setAddMenuOpen(false); setShowAddModal(true); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                <PenLine size={13} /> Manual Entry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs + search + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg self-start">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => patch({ tab: t.key })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                qs.tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.key === 'expiring' && expiringCount > 0 && (
                <span className="ml-1 text-[10px] text-amber-600">{expiringCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or passport number…"
            value={qs.search}
            onChange={e => patch({ search: e.target.value })}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
          />
        </div>

        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-lg transition-colors ${
            activeFiltersCount > 0
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-gray-200 text-gray-500 hover:text-gray-700'
          }`}
        >
          <SlidersHorizontal size={12} />
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>

      {/* Advanced filters */}
      {filtersOpen && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 border border-gray-100 rounded-xl">
          <select
            value={qs.gender}
            onChange={e => patch({ gender: e.target.value })}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select
            value={qs.district}
            onChange={e => patch({ district: e.target.value })}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
          >
            <option value="">All Districts</option>
            {NEPAL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={qs.passportValidMonths}
            onChange={e => patch({ passportValidMonths: e.target.value })}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white"
          >
            <option value="">Any Validity</option>
            <option value="6">Min 6 months</option>
            <option value="12">Min 12 months</option>
            <option value="24">Min 24 months</option>
          </select>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => patch({ gender: '', district: '', passportValidMonths: '' })}
              className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 border border-red-100 rounded-lg hover:bg-red-50"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Passport list */}
      {(() => {
        const displayList   = expiringList ?? passports;
        const isExpiringTab = expiringList !== null;
        return (
      <>
      {loading && displayList.length === 0 ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <BookOpen size={28} className="text-gray-300" />
          <p className="text-sm text-gray-400">
            {isExpiringTab
              ? 'No passports expiring in the next 60 days.'
              : qs.tab === 'lost'
                ? 'No passports marked as lost.'
                : qs.search || activeFiltersCount > 0
                  ? 'No passports match your filters.'
                  : 'No passports in the pool yet.'}
          </p>
          {!isExpiringTab && !qs.search && activeFiltersCount === 0 && qs.tab !== 'lost' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Plus size={12} /> Add first passport
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map(p => (
            <PassportRow
              key={p._id}
              passport={p}
              onAllocate={setAllocPassport}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!isExpiringTab && pagination?.pages > 1 && (
        <div className="mt-4">
          <Pagination
            page={qs.page}
            pages={pagination.pages}
            total={pagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={(p) => setQs(q => ({ ...q, page: p }))}
          />
        </div>
      )}
      </>
        );
      })()}

      {/* Modals */}
      <AddPassportModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { setShowAddModal(false); setQs(q => ({ ...q })); }}
      />

      {allocPassport && (
        <AllocationModal
          isOpen={Boolean(allocPassport)}
          onClose={() => setAllocPassport(null)}
          passport={allocPassport}
          onSuccess={() => { setAllocPassport(null); setQs(q => ({ ...q })); }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Passport"
        message="Are you sure you want to delete this passport? This action cannot be undone."
        confirmLabel="Delete Passport"
        confirmVariant="danger"
        loading={deleting}
        onCancel={() => !deleting && setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default PassportList;
