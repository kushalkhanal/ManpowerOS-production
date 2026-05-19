import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PlaneTakeoff, Search, RefreshCw, X,
  Calendar, Phone, Briefcase, Globe, ArrowLeftRight,
  FileText, DollarSign, User, MapPin,
  CheckCircle2, Plane
} from 'lucide-react';
import { departedApi } from '../api/departed.api';
import { getCountryFlag } from '../domain/workflow';
import { showToast } from '../components/ToastProvider';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
};

const RETURN_STATUS = {
  abroad:    { label: 'Abroad',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  returned:  { label: 'Returned',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  extended:  { label: 'Extended',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  absconded: { label: 'Absconded', color: 'bg-red-50 text-red-700 border-red-200' },
};

const StatusBadge = ({ status }) => {
  const s = RETURN_STATUS[status] || RETURN_STATUS.abroad;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.color}`}>
      {s.label}
    </span>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-400 shrink-0 w-32">{label}</span>
    <span className="text-xs text-gray-800 text-right font-medium">{value || '—'}</span>
  </div>
);

// ─── Detail Drawer ────────────────────────────────────────────────────────────

const DetailDrawer = ({ record, onClose, onStatusUpdated }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [returnStatus, setReturnStatus] = useState(record.returnStatus || 'abroad');
  const [returnNotes, setReturnNotes] = useState(record.returnNotes || '');
  const [savingStatus, setSavingStatus] = useState(false);
  const canEdit = ['admin', 'staff'].includes(user?.role);

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try {
      await departedApi.updateReturnStatus(record._id, { returnStatus, returnNotes });
      showToast.success('Return status updated');
      qc.invalidateQueries(['departed']);
      onStatusUpdated?.();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-700 font-bold text-sm">
                {record.fullName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{record.fullName}</p>
              <p className="text-xs text-gray-400 font-mono">{record.passportNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Return status */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2">Return Status</p>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={record.returnStatus} />
              <span className="text-xs text-gray-400">Departed {fmtDate(record.departedAt)}</span>
            </div>
            {canEdit && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                <select
                  value={returnStatus}
                  onChange={e => setReturnStatus(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {Object.entries(RETURN_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <textarea
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="Notes (optional)…"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  onClick={handleSaveStatus}
                  disabled={savingStatus}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {savingStatus ? 'Saving…' : 'Save Status'}
                </button>
              </div>
            )}
          </div>

          {/* Personal */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
              <User size={11} /> Personal
            </p>
            <InfoRow label="Phone" value={record.phone} />
            <InfoRow label="Gender" value={record.gender} />
            <InfoRow label="DOB" value={fmtDate(record.dateOfBirth)} />
            <InfoRow label="District" value={record.permanentDistrict} />
            <InfoRow label="Province" value={record.permanentProvince} />
            <InfoRow label="Nominee" value={record.nomineeInfo?.nomineeName} />
            <InfoRow label="Emergency" value={record.nomineeInfo?.emergencyContactNumber} />
          </div>

          {/* Employment */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
              <Briefcase size={11} /> Employment
            </p>
            <InfoRow label="Employer" value={record.employerCompanyName} />
            <InfoRow label="Country" value={record.employerCountry ? `${getCountryFlag(record.employerCountry)} ${record.employerCountry}` : null} />
            <InfoRow label="City" value={record.employerCity} />
            <InfoRow label="Job" value={record.jobCategory} />
            <InfoRow label="Lot No." value={record.lotNumber} />
            <InfoRow label="Salary" value={record.basicSalaryUSD ? `$${record.basicSalaryUSD}/mo` : null} />
            <InfoRow label="Contract" value={record.contractDurationMonths ? `${record.contractDurationMonths} months` : null} />
          </div>

          {/* Flight */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
              <Plane size={11} /> Flight
            </p>
            <InfoRow label="Departed" value={fmtDate(record.departedAt)} />
            <InfoRow label="Flight Date" value={fmtDate(record.flightDate)} />
            <InfoRow label="Flight No." value={record.flightNumber} />
            <InfoRow label="Airline" value={record.airline} />
            <InfoRow label="Reporting" value={record.airportReportingTime} />
          </div>

          {/* Processing Numbers */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
              <FileText size={11} /> Processing Numbers
            </p>
            <InfoRow label="Visa No." value={record.visaNumber} />
            <InfoRow label="Visa Expiry" value={fmtDate(record.visaExpiryDate)} />
            <InfoRow label="Shram No." value={record.shramSwikritiNumber} />
            <InfoRow label="Shram Expiry" value={fmtDate(record.shramExpiryDate)} />
            <InfoRow label="FEIMS No." value={record.feimsRegistrationNumber} />
            <InfoRow label="DoFE File" value={record.dofeFileNumber} />
            <InfoRow label="e-Sticker" value={record.eStickerNumber} />
            {record.vlnNumber && <InfoRow label="VLN" value={record.vlnNumber} />}
            {record.plksNumber && <InfoRow label="PLKS" value={record.plksNumber} />}
          </div>

          {/* Financials */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
              <DollarSign size={11} /> Financials
            </p>
            <InfoRow label="Fee Agreed" value={record.serviceFeeAgreed ? `NPR ${record.serviceFeeAgreed.toLocaleString()}` : null} />
            <InfoRow label="Fee Received" value={record.serviceFeeReceived ? `NPR ${record.serviceFeeReceived.toLocaleString()}` : null} />
            <InfoRow label="Payment" value={record.paymentStatus} />
          </div>

          {/* Agent / Sponsor */}
          {(record.agentName || record.sponsorName) && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
                <MapPin size={11} /> Agent / Sponsor
              </p>
              {record.agentName && <InfoRow label="Agent" value={`${record.agentName}${record.agentNumber ? ` · ${record.agentNumber}` : ''}`} />}
              {record.sponsorName && <InfoRow label="Sponsor" value={record.sponsorName} />}
            </div>
          )}

          {/* Files */}
          {Object.values(record.files || {}).some(Boolean) && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
                <FileText size={11} /> Documents
              </p>
              <div className="flex flex-wrap gap-2">
                {record.files?.passportScan && (
                  <a href={record.files.passportScan} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline border border-blue-100 bg-blue-50 px-2 py-1 rounded">
                    Passport Scan
                  </a>
                )}
                {record.files?.visaFile && (
                  <a href={record.files.visaFile} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline border border-blue-100 bg-blue-50 px-2 py-1 rounded">
                    Visa File
                  </a>
                )}
                {record.files?.departureFile && (
                  <a href={record.files.departureFile} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline border border-blue-100 bg-blue-50 px-2 py-1 rounded">
                    Departure Doc
                  </a>
                )}
                {record.files?.feimsFile && (
                  <a href={record.files.feimsFile} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline border border-blue-100 bg-blue-50 px-2 py-1 rounded">
                    FEIMS File
                  </a>
                )}
              </div>
            </div>
          )}

          {record.returnNotes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-700 font-medium mb-1">Return Notes</p>
              <p className="text-xs text-amber-800">{record.returnNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Qatar', 'Saudi Arabia', 'UAE', 'Kuwait', 'Malaysia',
  'Bahrain', 'Oman', 'South Korea', 'Japan', 'Israel',
  'Poland', 'Romania', 'Croatia',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const DepartedCandidates = () => {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [returnStatus, setReturnStatus] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const queryParams = { search, country, returnStatus, year, page, limit: 25 };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['departed', queryParams],
    queryFn: () => departedApi.getAll(queryParams).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: statsData } = useQuery({
    queryKey: ['departed-stats'],
    queryFn: () => departedApi.getStats().then(r => r.data),
    staleTime: 60_000,
  });

  const records = data?.data || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const topCountry = statsData?.byCountry?.[0];
  const abroadCount = statsData?.returnRate?.find(r => r._id === 'abroad')?.count || 0;
  const returnedCount = statsData?.returnRate?.find(r => r._id === 'returned')?.count || 0;

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PlaneTakeoff size={20} className="text-emerald-600" />
            Departed Records
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Permanent archive of all departed workers — fully searchable, return-trackable.
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={isFetching}
          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-2xl font-bold text-emerald-600">{total}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Total Departed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-2xl font-bold text-blue-600">{abroadCount}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Still Abroad</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-2xl font-bold text-gray-700">{returnedCount}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Returned</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-lg font-bold text-gray-700 flex items-center gap-1">
            {topCountry ? getCountryFlag(topCountry._id) : '—'}
            <span>{topCountry?._id || '—'}</span>
          </p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Top destination{topCountry ? ` (${topCountry.count})` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, passport, phone, visa…"
            value={search}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          />
        </div>
        <select
          value={country}
          onChange={handleFilter(setCountry)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="">All countries</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={returnStatus}
          onChange={handleFilter(setReturnStatus)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="">All statuses</option>
          {Object.entries(RETURN_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={handleFilter(setYear)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="">All years</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading records…</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <CheckCircle2 size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {total === 0 ? 'No departed records yet.' : 'No records match the current filters.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-2.5 font-semibold text-left">Worker</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Passport</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Destination</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Employer</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Departed</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Flight</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Visa / Shram</th>
                  <th className="px-4 py-2.5 font-semibold text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r._id}
                    onClick={() => setSelected(r)}
                    className="border-b border-gray-50 last:border-0 hover:bg-emerald-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.fullName}</div>
                      <div className="text-xs text-gray-400">{r.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {r.passportNumber || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-gray-700 text-xs">
                        {getCountryFlag(r.employerCountry)}
                        {r.employerCountry || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{r.employerCompanyName || '—'}</div>
                      {r.jobCategory && <div className="text-gray-400">{r.jobCategory}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} className="text-gray-400" />
                        {fmtDate(r.departedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{r.flightNumber || '—'}</div>
                      {r.airline && <div className="text-gray-400">{r.airline}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.visaNumber && <div>V: {r.visaNumber}</div>}
                      {r.shramSwikritiNumber && <div>S: {r.shramSwikritiNumber}</div>}
                      {!r.visaNumber && !r.shramSwikritiNumber && '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.returnStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{total} total records</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Prev
                </button>
                <span className="px-2">Page {page} of {pages}</span>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer
          record={selected}
          onClose={() => setSelected(null)}
          onStatusUpdated={() => {
            refetch();
            setSelected(null);
          }}
        />
      )}
    </div>
  );
};

export default DepartedCandidates;
