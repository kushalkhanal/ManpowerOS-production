import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { countryModulesApi } from '../../api/countryModules.api';
import {
  Tag, RefreshCw, ChevronRight, ChevronDown,
  CheckCircle2, Clock, AlertCircle
} from 'lucide-react';

// ─── Static maps ──────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  calling_visa_pending:  'VLN / Calling Visa Pending',
  calling_visa_received: 'VLN / Calling Letter Received',
  plks_applied:          'PLKS Applied',
  plks_received:         'PLKS Received',
  esticker_applied:      'E-Sticker Applied',
  esticker_received:     'E-Sticker Received'
};

const STATUS_COLOR = {
  calling_visa_pending:  'bg-yellow-50 text-yellow-700',
  calling_visa_received: 'bg-blue-50 text-blue-700',
  plks_applied:          'bg-purple-50 text-purple-700',
  plks_received:         'bg-green-50 text-green-700',
  esticker_applied:      'bg-orange-50 text-orange-700',
  esticker_received:     'bg-emerald-50 text-emerald-700'
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-CA') : null;
}

function ExpiryWarning({ date, label }) {
  if (!date) return null;
  const daysLeft = Math.floor((new Date(date) - Date.now()) / 86400000);
  if (daysLeft > 30) return null;
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${daysLeft < 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
      {label}: {daysLeft < 0 ? `expired ${-daysLeft}d ago` : `${daysLeft}d left`}
    </span>
  );
}

// ─── Inline VLN + PLKS form ───────────────────────────────────────────────────

function PlksForm({ row, onSaved }) {
  const [form, setForm] = useState({
    vlnNumber:               row.vlnNumber || '',
    vlnReceivedDate:         fmtDate(row.vlnReceivedDate) || '',
    vlnExpiryDate:           fmtDate(row.vlnExpiryDate) || '',
    fwcmsCallingLetterNumber:row.fwcmsCallingLetterNumber || '',
    fomemaReferenceNumber:   row.fomemaReferenceNumber || '',
    bestinetBiometricRef:    row.bestinetBiometricRef || '',
    plksNumber:              row.plksNumber || '',
    plksIssuedDate:          fmtDate(row.plksIssuedDate) || '',
    plksExpiryDate:          fmtDate(row.plksExpiryDate) || ''
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      await countryModulesApi.updateMalaysiaPlks(row._id, form);
      onSaved(row._id, form);
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      {/* VLN Section */}
      <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
        <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-2">VLN / Calling Letter (FWCMS)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-1">VLN Number</label>
            <input
              value={form.vlnNumber}
              onChange={e => set('vlnNumber', e.target.value)}
              placeholder="VLN-XXXXXXXX"
              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-1">Received Date</label>
            <input type="date" value={form.vlnReceivedDate} onChange={e => set('vlnReceivedDate', e.target.value)}
              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-1">Expiry Date</label>
            <input type="date" value={form.vlnExpiryDate} onChange={e => set('vlnExpiryDate', e.target.value)}
              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-1">FWCMS Calling Letter No.</label>
            <input value={form.fwcmsCallingLetterNumber} onChange={e => set('fwcmsCallingLetterNumber', e.target.value)}
              placeholder="FWCMS ref"
              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-1">FOMEMA Ref No.</label>
            <input value={form.fomemaReferenceNumber} onChange={e => set('fomemaReferenceNumber', e.target.value)}
              placeholder="FOMEMA ref"
              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-1">Bestinet Biometric Ref</label>
            <input value={form.bestinetBiometricRef} onChange={e => set('bestinetBiometricRef', e.target.value)}
              placeholder="Bestinet ref"
              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
        </div>
      </div>

      {/* PLKS Section */}
      <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100">
        <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide mb-2">PLKS / E-Sticker</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-1">PLKS Number</label>
            <input value={form.plksNumber} onChange={e => set('plksNumber', e.target.value)}
              placeholder="PLKS-XXXXXXXX"
              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-1">Issued Date</label>
            <input type="date" value={form.plksIssuedDate} onChange={e => set('plksIssuedDate', e.target.value)}
              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-1">Expiry Date</label>
            <input type="date" value={form.plksExpiryDate} onChange={e => set('plksExpiryDate', e.target.value)}
              className="w-full text-sm px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
        </div>
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="text-sm px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Candidate row ─────────────────────────────────────────────────────────────

function CandidateRow({ row, onSaved }) {
  const [open, setOpen] = useState(false);
  const hasVln  = !!row.vlnNumber;
  const hasPlks = !!row.plksNumber;

  return (
    <div className="border border-gray-100 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">🇲🇾 {row.fullName}</span>
            {row.company && <span className="text-xs text-gray-400 truncate">· {row.company}</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[row.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[row.status] || row.status}
            </span>
            <span className={`text-xs flex items-center gap-1 ${hasVln ? 'text-green-600' : 'text-gray-400'}`}>
              {hasVln ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              VLN {hasVln ? row.vlnNumber : 'pending'}
            </span>
            <span className={`text-xs flex items-center gap-1 ${hasPlks ? 'text-green-600' : 'text-gray-400'}`}>
              {hasPlks ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              PLKS {hasPlks ? row.plksNumber : 'pending'}
            </span>
            <ExpiryWarning date={row.vlnExpiryDate} label="VLN" />
            <ExpiryWarning date={row.plksExpiryDate} label="PLKS" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/candidates/${row._id}`}
            onClick={e => e.stopPropagation()}
            className="text-xs text-primary hover:underline"
          >
            Open
          </Link>
          {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-50">
          {(row.demandLetterNo || row.passportNumber) && (
            <div className="flex gap-4 py-2 text-xs text-gray-500 flex-wrap">
              {row.passportNumber  && <span>Passport: <strong>{row.passportNumber}</strong></span>}
              {row.demandLetterNo  && <span>Demand: <strong>{row.demandLetterNo}</strong></span>}
              {row.purbaSwukritiNo && <span>Purba Swukriti: <strong>{row.purbaSwukritiNo}</strong></span>}
            </div>
          )}
          <PlksForm row={row} onSaved={onSaved} />
        </div>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, subtitle, icon: Icon, iconColor, rows, emptyMsg, onSaved }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
      >
        <Icon size={18} className={iconColor} />
        <div className="flex-1 min-w-0 text-left">
          <span className="font-semibold text-gray-900">{title}</span>
          {subtitle && <span className="text-xs text-gray-400 ml-2">{subtitle}</span>}
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{rows.length}</span>
        <ChevronDown size={16} className={`ml-2 text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      {!collapsed && (
        <div className="p-4 space-y-2">
          {rows.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">{emptyMsg}</p>
            : rows.map(r => <CandidateRow key={r._id} row={r} onSaved={onSaved} />)
          }
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MalaysiaPlksBoard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]   = useState('');

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await countryModulesApi.getMalaysiaPlksBoard();
      setData(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load Malaysia PLKS board');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterRows = rows => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.fullName?.toLowerCase().includes(q) ||
      r.company?.toLowerCase().includes(q) ||
      r.vlnNumber?.toLowerCase().includes(q) ||
      r.plksNumber?.toLowerCase().includes(q)
    );
  };

  const handleSaved = (candidateId, updates) => {
    setData(prev => {
      if (!prev) return prev;
      const patch = section => section.map(r => r._id === candidateId ? { ...r, ...updates } : r);
      return {
        ...prev,
        vlnStage:  patch(prev.vlnStage),
        plksStage: patch(prev.plksStage)
      };
    });
  };

  if (loading) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
          <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
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

  const { vlnStage = [], plksStage = [], total = 0 } = data || {};

  const expiringVln  = vlnStage.filter(r  => r.vlnExpiryDate  && Math.floor((new Date(r.vlnExpiryDate)  - Date.now()) / 86400000) <= 30).length;
  const expiringPlks = plksStage.filter(r => r.plksExpiryDate && Math.floor((new Date(r.plksExpiryDate) - Date.now()) / 86400000) <= 30).length;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <span className="text-xl leading-none">🇲🇾</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Malaysia VLN & PLKS Board</h1>
              <p className="text-sm text-gray-400">
                {total} candidates
                {(expiringVln + expiringPlks) > 0 && (
                  <span className="ml-2 text-orange-600 font-medium">
                    · {expiringVln + expiringPlks} expiring soon
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, company, VLN, PLKS…"
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none w-64"
          />
          {/* Pipeline step guide */}
          <div className="flex items-center gap-2 text-sm ml-4">
            <span className="font-medium text-blue-600">VLN / Calling Letter</span>
            <span className="text-gray-300">→</span>
            <span className="font-medium text-purple-600">PLKS / E-Sticker</span>
            <span className="text-gray-300">→</span>
            <span className="font-medium text-gray-400">FEIMS</span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        {/* Expiry alert banner */}
        {(expiringVln + expiringPlks) > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>
              <strong>{expiringVln + expiringPlks}</strong> document(s) expiring within 30 days —
              review and renew before departure.
            </span>
          </div>
        )}

        <Section
          title="VLN / Calling Letter Stage"
          subtitle="FWCMS · FOMEMA · Bestinet"
          icon={Tag}
          iconColor="text-blue-500"
          rows={filterRows(vlnStage)}
          emptyMsg="No candidates in VLN/calling letter stage."
          onSaved={handleSaved}
        />

        <Section
          title="PLKS / E-Sticker Stage"
          subtitle="Pas Lawatan Kerja Sementara"
          icon={CheckCircle2}
          iconColor="text-purple-500"
          rows={filterRows(plksStage)}
          emptyMsg="No candidates at PLKS stage."
          onSaved={handleSaved}
        />
      </div>
    </div>
  );
};

export default MalaysiaPlksBoard;
