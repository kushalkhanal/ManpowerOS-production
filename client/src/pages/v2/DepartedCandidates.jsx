import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlaneTakeoff, Search, ExternalLink, RefreshCw, CheckCircle2, Calendar
} from 'lucide-react';
import { candidatesApi } from '../../api';
import { getCountryFlag } from '../../domain/workflow';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return '—'; }
};

const fmtMonth = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch { return null; }
};

const DepartedCandidates = () => {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['candidates', 'departed'],
    queryFn: () => candidatesApi.getAll({ status: 'departed', limit: 500 }).then(r => r.data),
  });

  const candidates = data?.data || data?.candidates || data || [];

  const countryOptions = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => {
      const co = c.demandCountry || c.desiredCountry;
      if (co) set.add(co);
    });
    return Array.from(set).sort();
  }, [candidates]);

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const co = c.demandCountry || c.desiredCountry;
      if (country && co !== country) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.fullName?.toLowerCase().includes(q) ||
        c.passportNumber?.toLowerCase().includes(q) ||
        c.demandCompany?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        (co || '').toLowerCase().includes(q)
      );
    });
  }, [candidates, search, country]);

  // Group by departure month for the side stat
  const byMonth = useMemo(() => {
    const map = new Map();
    candidates.forEach(c => {
      const m = fmtMonth(c.departedAt || c.actualDepartureDate || c.flightDate);
      if (!m) return;
      map.set(m, (map.get(m) || 0) + 1);
    });
    return Array.from(map.entries()).slice(0, 6);
  }, [candidates]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PlaneTakeoff size={20} className="text-emerald-600" />
            Departed Candidates
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Workers who have already departed for their destination country.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-2xl font-bold text-emerald-600">{candidates.length}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Total Departed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-2xl font-bold text-gray-700">{countryOptions.length}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Countries</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-2xl font-bold text-gray-700">
            {byMonth[0]?.[1] ?? 0}
          </p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            {byMonth[0]?.[0] ? `Departed in ${byMonth[0][0]}` : 'This month'}
          </p>
        </div>
      </div>

      {/* Search + country filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, passport, company, phone, country…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          />
        </div>
        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="">All countries</option>
          {countryOptions.map(co => (
            <option key={co} value={co}>{co}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading departed candidates…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <CheckCircle2 size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {candidates.length === 0
              ? 'No candidates have departed yet.'
              : `No candidates match "${search || country}"`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="px-4 py-2.5 font-semibold text-left">Candidate</th>
                <th className="px-4 py-2.5 font-semibold text-left">Passport No.</th>
                <th className="px-4 py-2.5 font-semibold text-left">Country</th>
                <th className="px-4 py-2.5 font-semibold text-left">Employer</th>
                <th className="px-4 py-2.5 font-semibold text-left">Departed</th>
                <th className="px-4 py-2.5 font-semibold text-left">Flight</th>
                <th className="px-4 py-2.5 font-semibold text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.fullName}</div>
                    <div className="text-xs text-gray-400">{c.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {c.passportNumber ? (
                      <span className="font-mono text-[13px] text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {c.passportNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                      {getCountryFlag(c.demandCountry || c.desiredCountry)}
                      <span>{c.demandCountry || c.desiredCountry || '—'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.demandCompany || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-gray-400" />
                      {fmtDate(c.departedAt || c.actualDepartureDate || c.flightDate)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.flightNumber || '—'}
                    {c.airline && <span className="text-xs text-gray-400 ml-1">· {c.airline}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/candidates/${c._id}`}
                      className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium"
                    >
                      Open <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DepartedCandidates;
