import { useState } from 'react';
import { Check, X, Edit2, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import { candidatesApi } from '../api';
import { showToast } from './ToastProvider';

/**
 * ComplianceRecordsCard
 *
 * Single compact card for storing the government-portal numbers that this
 * system does NOT manage as a workflow. The candidate gets issued these on
 * the DoFE / FEIMS / FWCMS portals; we just store the resulting numbers.
 *
 * Rows:
 *   • Purba Swukriti       — boolean toggle (done / not done)
 *   • FEIMS Registration # — text
 *   • Shram Swukriti #     — text
 *   • PLKS / VLN #         — text
 *   • E-sticker #          — text
 *
 * Props:
 *   candidate   — full candidate object from kanbanData
 *   onUpdated   — () => void, called after a successful save so the parent reloads
 */

// ─── Inline-editable text row ─────────────────────────────────────────────────

const TextRow = ({ label, value, fieldName, candidateId, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(value || '');
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if ((value || '') === trimmed) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await candidatesApi.update(candidateId, { [fieldName]: trimmed || null });
      showToast.success(`${label} saved`);
      setEditing(false);
      onSaved?.();
    } catch (err) {
      showToast.error(err.response?.data?.message || `Failed to save ${label}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 flex-shrink-0 min-w-[120px]">
        {label}
      </span>

      {editing ? (
        <div className="flex items-center gap-1.5 flex-1 max-w-[260px]">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') cancel();
            }}
            autoFocus
            disabled={saving}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder={label}
          />
          <button
            onClick={save}
            disabled={saving}
            className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
            title="Save"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button
            onClick={cancel}
            disabled={saving}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-50"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={startEdit}
          className="flex items-center gap-2 text-sm font-medium text-right group flex-1 justify-end"
          title="Click to edit"
        >
          <span className={value ? 'text-gray-800' : 'text-gray-300 italic'}>
            {value || 'Not recorded'}
          </span>
          <Edit2 size={12} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
        </button>
      )}
    </div>
  );
};

// ─── Boolean toggle row (Purba Swukriti) ──────────────────────────────────────

const ToggleRow = ({ label, value, fieldName, candidateId, onSaved }) => {
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      await candidatesApi.update(candidateId, { [fieldName]: !value });
      showToast.success(`${label} ${!value ? 'marked done' : 'unmarked'}`);
      onSaved?.();
    } catch (err) {
      showToast.error(err.response?.data?.message || `Failed to update ${label}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 flex-shrink-0 min-w-[120px]">
        {label}
      </span>
      <button
        onClick={toggle}
        disabled={saving}
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-60 ${
          value
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {saving
          ? <Loader2 size={12} className="animate-spin" />
          : value
            ? <><Check size={12} /> Done</>
            : 'Mark Done'
        }
      </button>
    </div>
  );
};

// ─── Main card ────────────────────────────────────────────────────────────────

const ComplianceRecordsCard = ({ candidate, onUpdated }) => {
  if (!candidate?._id) return null;
  const candidateId = candidate._id;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-sky-50/60 to-white">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-sky-600" />
          <h3 className="text-sm font-semibold text-gray-700">Government Compliance</h3>
        </div>
        <a
          href="https://feims.dofe.gov.np"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-medium"
        >
          DoFE FEIMS <ExternalLink size={10} />
        </a>
      </header>

      <div className="px-5 py-2">
        <ToggleRow
          label="Purba Swukriti"
          value={!!candidate.purbaSwukritiDone}
          fieldName="purbaSwukritiDone"
          candidateId={candidateId}
          onSaved={onUpdated}
        />
        <TextRow
          label="FEIMS Reg. No."
          value={candidate.feimsRegistrationNumber}
          fieldName="feimsRegistrationNumber"
          candidateId={candidateId}
          onSaved={onUpdated}
        />
        <TextRow
          label="Shram Swukriti No."
          value={candidate.shramSwikritiNumber}
          fieldName="shramSwikritiNumber"
          candidateId={candidateId}
          onSaved={onUpdated}
        />
        <TextRow
          label="PLKS / VLN No."
          value={candidate.plksNumber || candidate.vlnNumber}
          fieldName="plksNumber"
          candidateId={candidateId}
          onSaved={onUpdated}
        />
        <TextRow
          label="E-sticker No."
          value={candidate.eStickerNumber}
          fieldName="eStickerNumber"
          candidateId={candidateId}
          onSaved={onUpdated}
        />
      </div>

      <div className="px-5 py-2.5 bg-gray-50/70 border-t border-gray-100">
        <p className="text-[11px] text-gray-500 leading-relaxed">
          All these are issued on government portals. Record the numbers here once obtained — no workflow needed.
        </p>
      </div>
    </div>
  );
};

export default ComplianceRecordsCard;
