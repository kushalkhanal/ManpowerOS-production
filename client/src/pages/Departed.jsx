import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidatesApi } from '../api';
import {
  PlaneTakeoff, Search, ExternalLink, Calendar, MapPin, Briefcase, Phone
} from 'lucide-react';
import { getCountryFlag } from '../domain/workflow';

const PAGE_SIZE = 20;

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const daysSince = (d) => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return Number.isNaN(diff) ? null : diff;
};

const Departed = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await candidatesApi.getAll({
        status: 'departed',
        search: search || undefined,
        page,
        limit: PAGE_SIZE
      });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load departed records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchData(); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PlaneTakeoff size={20} className="text-primary" />
            <h1 className="text-xl font-bold text-gray-900">Departed</h1>
          </div>
          <p className="text-sm text-gray-500">
            Workers who have completed departure. Read-only archive.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total departed</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{total}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, passport number, phone…"
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-10">#</th>
              <th className="px-4 py-3 text-left">Person</th>
              <th className="px-4 py-3 text-left">Passport No.</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Country / Employer</th>
              <th className="px-4 py-3 text-left">Departed</th>
              <th className="px-4 py-3 text-left">Agent / Sponsor</th>
              <th className="px-4 py-3 text-center w-16">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <PlaneTakeoff size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No departed records yet.</p>
                  <p className="text-xs mt-1">Workers will appear here once their status is marked as departed.</p>
                </td>
              </tr>
            )}
            {!loading && rows.map((c, idx) => {
              const days = daysSince(c.departedAt || c.flightDate);
              return (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-3">
                    <Link to={`/candidates/${c._id}`} className="block hover:text-primary">
                      <span className="font-semibold text-gray-900 text-sm">{c.fullName || '—'}</span>
                      {c.desiredCountry && (
                        <span className="ml-1.5">{getCountryFlag(c.desiredCountry)}</span>
                      )}
                      {c.fullNameNepali && (
                        <div className="text-[11px] text-gray-400">{c.fullNameNepali}</div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.passportNumber || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {c.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={11} className="text-gray-400" />
                        {c.phone}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {c.desiredCountry && (
                      <div className="inline-flex items-center gap-1">
                        <MapPin size={11} className="text-gray-400" /> {c.desiredCountry}
                      </div>
                    )}
                    {c.desiredJobCategory && (
                      <div className="inline-flex items-center gap-1 mt-0.5 text-gray-500">
                        <Briefcase size={11} className="text-gray-400" /> {c.desiredJobCategory}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    <div className="inline-flex items-center gap-1">
                      <Calendar size={11} className="text-gray-400" />
                      {fmt(c.departedAt || c.flightDate)}
                    </div>
                    {days !== null && (
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {days === 0 ? 'today' : `${days}d ago`}
                      </div>
                    )}
                    {c.flightNumber && (
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {c.airline || ''} {c.flightNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {c.agentName && (
                      <div>
                        <span className="text-gray-400">Agent:</span> {c.agentName}
                      </div>
                    )}
                    {c.sponsorName && (
                      <div className="mt-0.5">
                        <span className="text-gray-400">Sponsor:</span> {c.sponsorName}
                      </div>
                    )}
                    {!c.agentName && !c.sponsorName && '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      to={`/candidates/${c._id}`}
                      className="inline-flex p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Open full record"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {pages} · {total} records</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departed;
