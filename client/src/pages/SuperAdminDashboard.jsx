import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Building2, Users, TrendingUp, AlertTriangle,
  RefreshCw, CheckCircle2, XCircle, ExternalLink, Clock,
  ChevronRight, Zap, BarChart3
} from 'lucide-react';
import superAdminApi from '../api/superAdmin.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_META = {
  trial:  { label: 'Trial',  price: 0,    color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400',  candidateLimit: 20,  userLimit: 1 },
  basic:  { label: 'Basic',  price: 2000, color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',   candidateLimit: 200, userLimit: 5 },
  pro:    { label: 'Pro',    price: 5000, color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', candidateLimit: null, userLimit: null },
};

const fmt = (n) => new Intl.NumberFormat('en-NP').format(n);

function daysDiff(date) {
  return Math.ceil((new Date(date) - Date.now()) / 86400000);
}

function daysSince(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, iconBg, to }) {
  const inner = (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow h-full">
      <div className={`p-2.5 rounded-lg shrink-0 ${iconBg}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  if (to) return <Link to={to} className="block">{inner}</Link>;
  return inner;
}

function PlanBadge({ plan }) {
  const m = PLAN_META[plan] || PLAN_META.trial;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function AgencyRow({ agency, onImpersonate }) {
  const atLimit = agency.plan === 'basic' && agency.candidateCount >= 180;
  const expiring = agency.planExpiresAt && daysDiff(agency.planExpiresAt) <= 7 && daysDiff(agency.planExpiresAt) > 0;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-5 px-5 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">{agency.name}</p>
          <PlanBadge plan={agency.plan} />
          {!agency.isActive && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded">INACTIVE</span>
          )}
          {atLimit && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">NEAR LIMIT</span>
          )}
          {expiring && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
              EXPIRING {daysDiff(agency.planExpiresAt)}d
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {agency.candidateCount} candidates · {agency.userCount} users · {daysSince(agency.createdAt)}
        </p>
      </div>
      <button
        onClick={() => onImpersonate(agency._id)}
        className="text-xs text-primary hover:text-primary/80 font-medium shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
        title="Impersonate this agency"
      >
        Enter <ExternalLink size={11} />
      </button>
    </div>
  );
}

function HealthFlag({ icon: Icon, color, title, count, children }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${color}`}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title} <span className="font-bold">({count})</span></p>
        <div className="mt-1.5 space-y-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SuperAdminDashboard = () => {
  const [stats, setStats]       = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [statsRes, agenciesRes] = await Promise.all([
        superAdminApi.getStats(),
        superAdminApi.getAllAgencies(),
      ]);
      setStats(statsRes.data?.data ?? statsRes.data);
      setAgencies(agenciesRes.data?.data ?? agenciesRes.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load platform data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleImpersonate = async (agencyId) => {
    try {
      const res = await superAdminApi.impersonateAgency(agencyId);
      const { token, user, agency } = res.data?.data ?? res.data;
      localStorage.setItem('admin_token', localStorage.getItem('token'));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...user, isImpersonating: true }));
      localStorage.setItem('agency', JSON.stringify(agency));
      window.location.href = '/candidates';
    } catch {
      alert('Failed to impersonate agency');
    }
  };

  // ── Derived metrics ──────────────────────────────────────────────────────────

  const planGroups = { trial: [], basic: [], pro: [] };
  agencies.forEach(a => { (planGroups[a.plan] || (planGroups.trial)).push(a); });

  const activeAgencies = agencies.filter(a => a.isActive);
  const mrr = activeAgencies.reduce((sum, a) => sum + (PLAN_META[a.plan]?.price || 0), 0);

  const expiringTrials = agencies.filter(a =>
    a.plan === 'trial' && a.planExpiresAt &&
    daysDiff(a.planExpiresAt) <= 7 && daysDiff(a.planExpiresAt) > 0
  );

  const nearLimit = agencies.filter(a =>
    a.plan === 'basic' && a.candidateCount >= 180
  );

  const emptyAgencies = agencies.filter(a =>
    a.isActive && a.candidateCount === 0 && a.plan === 'trial' &&
    Math.floor((Date.now() - new Date(a.createdAt)) / 86400000) >= 3
  );

  const recentAgencies = [...agencies]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const hasFlags = expiringTrials.length > 0 || nearLimit.length > 0 || emptyAgencies.length > 0;

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="h-6 w-52 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-36 bg-gray-100 rounded animate-pulse mt-2" />
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
            <div className="h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertTriangle size={40} className="text-red-400" />
        <p className="text-gray-600">{error}</p>
        <button onClick={() => fetchAll()} className="text-sm text-primary hover:underline">Try again</button>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Platform Oversight</h1>
              <p className="text-xs text-gray-400">ManpowerOS · Super Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/superadmin/agencies"
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              All Agencies <ChevronRight size={14} />
            </Link>
            <button
              onClick={() => fetchAll(true)}
              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── KPI cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            icon={Building2}
            label="Total Agencies"
            value={stats?.agencies?.total ?? agencies.length}
            sub={`${stats?.agencies?.active ?? activeAgencies.length} active`}
            iconBg="bg-primary"
            to="/superadmin/agencies"
          />
          <KpiCard
            icon={Users}
            label="All Candidates"
            value={fmt(stats?.candidates?.total ?? 0)}
            sub="Across all agencies"
            iconBg="bg-blue-500"
          />
          <KpiCard
            icon={TrendingUp}
            label="MRR"
            value={`NPR ${fmt(mrr)}`}
            sub={`${activeAgencies.filter(a => a.plan !== 'trial').length} paying agencies`}
            iconBg="bg-emerald-500"
          />
          <KpiCard
            icon={Clock}
            label="On Trial"
            value={planGroups.trial.length}
            sub={`${expiringTrials.length} expiring ≤7 days`}
            iconBg="bg-amber-400"
          />
          <KpiCard
            icon={Zap}
            label="Platform Users"
            value={fmt(stats?.users?.total ?? 0)}
            sub="Admins & staff"
            iconBg="bg-indigo-500"
          />
        </div>

        {/* ── Health flags ──────────────────────────────────────────────────── */}
        {hasFlags && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-400" />
              Needs Attention
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {expiringTrials.length > 0 && (
                <HealthFlag
                  icon={Clock}
                  color="bg-amber-50 border-amber-200 text-amber-800"
                  title="Trials expiring soon"
                  count={expiringTrials.length}
                >
                  {expiringTrials.slice(0, 3).map(a => (
                    <p key={a._id} className="text-xs truncate">
                      {a.name} — <span className="font-semibold">{daysDiff(a.planExpiresAt)}d left</span>
                    </p>
                  ))}
                </HealthFlag>
              )}
              {nearLimit.length > 0 && (
                <HealthFlag
                  icon={BarChart3}
                  color="bg-orange-50 border-orange-200 text-orange-800"
                  title="Near candidate limit"
                  count={nearLimit.length}
                >
                  {nearLimit.slice(0, 3).map(a => (
                    <p key={a._id} className="text-xs truncate">
                      {a.name} — <span className="font-semibold">{a.candidateCount}/200</span>
                    </p>
                  ))}
                </HealthFlag>
              )}
              {emptyAgencies.length > 0 && (
                <HealthFlag
                  icon={XCircle}
                  color="bg-gray-50 border-gray-200 text-gray-600"
                  title="Inactive (0 candidates)"
                  count={emptyAgencies.length}
                >
                  {emptyAgencies.slice(0, 3).map(a => (
                    <p key={a._id} className="text-xs truncate">
                      {a.name} — joined {daysSince(a.createdAt)}
                    </p>
                  ))}
                </HealthFlag>
              )}
            </div>
          </div>
        )}

        {/* ── Plan distribution + Recent agencies ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Plan breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" />
              Plan Distribution
            </h2>
            <div className="space-y-4">
              {Object.entries(PLAN_META).map(([key, meta]) => {
                const list = planGroups[key] || [];
                const activeCount = list.filter(a => a.isActive).length;
                const revenue = activeCount * meta.price;
                const pct = agencies.length > 0 ? Math.round((list.length / agencies.length) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                        <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                        <span className="text-xs text-gray-400">{list.length} agencies</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {meta.price > 0 ? `NPR ${fmt(revenue)}/mo` : 'Free'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${meta.dot}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{activeCount} active · {pct}% of total</p>
                  </div>
                );
              })}
            </div>

            {/* MRR summary */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">Monthly Recurring Revenue</span>
              <span className="text-lg font-bold text-primary">NPR {fmt(mrr)}</span>
            </div>
          </div>

          {/* Recent agencies */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                Recent Agencies
              </h2>
              <Link
                to="/superadmin/agencies"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ExternalLink size={11} />
              </Link>
            </div>
            <p className="text-xs text-gray-400 mb-3">Latest registrations</p>
            <div>
              {recentAgencies.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Building2 size={28} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No agencies yet</p>
                </div>
              ) : (
                recentAgencies.map(agency => (
                  <AgencyRow key={agency._id} agency={agency} onImpersonate={handleImpersonate} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── All-time totals bar ────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Platform Totals
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Agencies',   value: stats?.agencies?.total ?? agencies.length,   color: 'text-primary' },
              { label: 'Candidates', value: stats?.candidates?.total ?? 0,               color: 'text-blue-600' },
              { label: 'Staff',      value: stats?.users?.total ?? 0,                    color: 'text-indigo-600' },
              { label: 'Passports',  value: stats?.passports?.total ?? 0,               color: 'text-emerald-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="py-3 px-4 bg-gray-50 rounded-xl">
                <p className={`text-2xl font-bold ${color}`}>{fmt(value)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
