import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../hooks/useAlerts';
import { dashboardApi } from '../../api/dashboard.api';
import {
  RefreshCw, AlertTriangle, Users, Globe, Plane,
  AlertCircle, CheckCircle2, XCircle, Clock, TrendingUp,
  ChevronRight, ExternalLink
} from 'lucide-react';

// ─── Static maps ──────────────────────────────────────────────────────────────

const DEPARTURE_STATUS_LABEL = {
  feims_registered:     'FEIMS Registered',
  shram_applied:        'Shram Applied',
  shram_issued:         'Shram Issued',
  flight_booked:        'Flight Booked',
  airport_slot_assigned:'Airport Slot'
};

const DEPARTURE_STATUS_COLOR = {
  feims_registered:      'bg-blue-50 text-blue-700',
  shram_applied:         'bg-yellow-50 text-yellow-700',
  shram_issued:          'bg-green-50 text-green-700',
  flight_booked:         'bg-purple-50 text-purple-700',
  airport_slot_assigned: 'bg-emerald-50 text-emerald-700'
};

const BLOCKED_LABEL = {
  medical_failed:      'Medical Failed',
  trade_test_failed:   'Trade Test Failed',
  medical_expired:     'Medical Expired',
  orientation_absent:  'Orientation Absent',
  visa_rejected:       'Visa Rejected',
  on_hold:             'On Hold'
};

const BLOCKED_COLOR = {
  medical_failed:     'bg-red-50 text-red-700',
  trade_test_failed:  'bg-red-50 text-red-700',
  medical_expired:    'bg-orange-50 text-orange-700',
  orientation_absent: 'bg-orange-50 text-orange-700',
  visa_rejected:      'bg-red-50 text-red-700',
  on_hold:            'bg-yellow-50 text-yellow-700'
};

const FUNNEL_PALETTE = [
  '#94a3b8', '#60a5fa', '#34d399', '#a78bfa',
  '#f59e0b', '#f472b6', '#22d3ee', '#4ade80',
  '#fb923c', '#818cf8', '#e879f9', '#86efac'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name?.split(' ')[0] || 'there'}`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function daysSince(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, to, onClick }) {
  const interactive = to || onClick;
  const cls = `bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow text-left w-full ${interactive ? 'cursor-pointer' : ''}`;
  const inner = (
    <>
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </>
  );
  if (to)      return <Link to={to} className={cls}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

function PipelineFunnel({ funnel }) {
  if (!funnel?.length) return (
    <p className="text-sm text-gray-400 py-4 text-center">No active candidates in pipeline.</p>
  );

  const maxCount = Math.max(...funnel.map(s => s.count), 1);

  return (
    <div className="space-y-2.5">
      {funnel.map((stage, i) => (
        <div key={stage.id} className="flex items-center gap-3">
          <div className="w-36 shrink-0 text-right">
            <span className="text-xs text-gray-500 truncate block">{stage.label}</span>
          </div>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max((stage.count / maxCount) * 100, 2)}%`,
                backgroundColor: FUNNEL_PALETTE[i % FUNNEL_PALETTE.length]
              }}
            />
          </div>
          <span className="w-8 text-right text-sm font-semibold text-gray-700">{stage.count}</span>
        </div>
      ))}
    </div>
  );
}

function DepartureRow({ c }) {
  const statusLabel = DEPARTURE_STATUS_LABEL[c.status] || c.status;
  const statusColor = DEPARTURE_STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-600';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{c.fullName}</p>
        <p className="text-xs text-gray-400 truncate">
          {[c.country, c.company].filter(Boolean).join(' · ') || 'No demand'}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        {c.feimsRegistrationNumber
          ? <CheckCircle2 size={14} className="text-green-500" title="FEIMS registered" />
          : <XCircle size={14} className="text-gray-300" title="FEIMS pending" />
        }
        {c.shramSwikritiNumber
          ? <CheckCircle2 size={14} className="text-green-500" title="Shram issued" />
          : <XCircle size={14} className="text-gray-300" title="Shram pending" />
        }
      </div>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
        {statusLabel}
      </span>
      <Link to={`/candidates/${c._id}`} className="text-gray-300 hover:text-primary transition-colors shrink-0">
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function BlockedRow({ c }) {
  const label = BLOCKED_LABEL[c.status] || c.status;
  const color = BLOCKED_COLOR[c.status] || 'bg-gray-100 text-gray-600';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{c.fullName}</p>
        <p className="text-xs text-gray-400">{daysSince(c.stuckSince)}</p>
      </div>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${color}`}>
        {label}
      </span>
      <Link to={`/candidates/${c._id}`} className="text-gray-300 hover:text-primary transition-colors shrink-0">
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TodayDashboard = () => {
  const { user } = useAuth();
  const { counts, getCounts } = useAlerts();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [overviewRes] = await Promise.all([
        dashboardApi.getOverview(),
        getCounts()
      ]);
      setData(overviewRes.data?.data ?? overviewRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getCounts]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-36 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-600">{error}</p>
        <button onClick={() => fetchAll()} className="text-sm text-primary hover:underline">Try again</button>
      </div>
    );
  }

  const { funnel = [], departureBoard = [], blocked = [], activeTotal, feimsReadyCount, departingCount, blockedCount } = data || {};

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{greeting(user?.name)}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{todayLabel()}</p>
          </div>
          <button
            onClick={() => fetchAll(true)}
            className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Alert banner ──────────────────────────────────────────────── */}
        {counts.critical > 0 && (
          <Link
            to="/alerts"
            className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 hover:bg-red-100 transition-colors"
          >
            <AlertTriangle size={18} className="shrink-0" />
            <span className="text-sm font-medium">
              {counts.critical} critical alert{counts.critical !== 1 ? 's' : ''} need attention
            </span>
            <ChevronRight size={16} className="ml-auto shrink-0" />
          </Link>
        )}

        {/* ── Stat cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Active Candidates"
            value={activeTotal}
            sub="in pipeline"
            color="bg-blue-500"
            to="/candidates"
          />
          <StatCard
            icon={Globe}
            label="FEIMS Pending"
            value={feimsReadyCount}
            sub="awaiting submission"
            color="bg-indigo-500"
            to="/feims"
          />
          <StatCard
            icon={Plane}
            label="Departing Soon"
            value={departingCount}
            sub="final stages"
            color="bg-emerald-500"
            onClick={() => {
              const el = document.getElementById('departure-board');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
          <StatCard
            icon={AlertCircle}
            label="Blocked"
            value={blockedCount}
            sub="need resolution"
            color={blockedCount > 0 ? 'bg-red-500' : 'bg-gray-400'}
          />
        </div>

        {/* ── Pipeline funnel ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="font-semibold text-gray-900">Pipeline Overview</h2>
            </div>
            <span className="text-xs text-gray-400">{activeTotal} active total</span>
          </div>
          <PipelineFunnel funnel={funnel} />
        </div>

        {/* ── Two-column: Departure board + Blocked ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Departure board */}
          <div id="departure-board" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 scroll-mt-24">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Plane size={18} className="text-emerald-500" />
                <h2 className="font-semibold text-gray-900">Departure Board</h2>
              </div>
              <span className="text-xs text-gray-400">FEIMS · Shram · Flight</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Candidates in final pre-departure stages</p>
            {departureBoard.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No candidates in departure stages.</p>
            ) : (
              <div>
                {departureBoard.map(c => <DepartureRow key={c._id} c={c} />)}
              </div>
            )}
          </div>

          {/* Blocked / Attention needed */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-400" />
                <h2 className="font-semibold text-gray-900">Needs Attention</h2>
              </div>
              {counts.warning > 0 && (
                <Link to="/alerts" className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                  {counts.warning} warnings <ExternalLink size={11} />
                </Link>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4">Candidates stuck in a blocking status</p>
            {blocked.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <CheckCircle2 size={28} className="text-green-400" />
                <p className="text-sm text-gray-400">No blocked candidates</p>
              </div>
            ) : (
              <div>
                {blocked.map(c => <BlockedRow key={c._id} c={c} />)}
              </div>
            )}
          </div>
        </div>

        {/* ── Quick links ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap pb-2">
          <span className="text-xs text-gray-400 font-medium">Quick links:</span>
          {[
            { label: 'All Candidates', href: '/candidates' },
            { label: 'FEIMS Center',   href: '/feims' },
            { label: 'Passports',      href: '/passports' },
            { label: 'Demands',        href: '/demands' },
            { label: 'Alerts',         href: '/alerts' },
          ].map(l => (
            <Link
              key={l.href}
              to={l.href}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default TodayDashboard;
