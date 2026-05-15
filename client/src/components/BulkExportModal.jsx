import { useState, useMemo } from 'react';
import { candidatesApi } from '../api';
import { showToast } from './ToastProvider';
import { Download, X, Loader2, FileSpreadsheet, FileText } from 'lucide-react';

// ─── Field catalog ────────────────────────────────────────────────────────────
// Each field has: key (unique), label (column header), get (row → value),
// and group (display section).

const fmtDate = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';

const FIELDS = [
  // Identity
  { key: 'fullName',          label: 'Full Name',         group: 'Identity',  get: ({ candidate }) => candidate.fullName },
  { key: 'fullNameNepali',    label: 'Name (Nepali)',     group: 'Identity',  get: ({ candidate }) => candidate.fullNameNepali },
  { key: 'phone',             label: 'Phone',             group: 'Identity',  get: ({ candidate }) => candidate.phone },
  { key: 'nationalIdNumber',  label: 'Citizenship / NID', group: 'Identity',  get: ({ candidate }) => candidate.nationalIdNumber },
  { key: 'gender',            label: 'Gender',            group: 'Identity',  get: ({ candidate }) => candidate.gender },
  { key: 'dateOfBirth',       label: 'Date of Birth',     group: 'Identity',  get: ({ candidate }) => fmtDate(candidate.dateOfBirth) },
  { key: 'permanentDistrict', label: 'District',          group: 'Identity',  get: ({ candidate }) => candidate.permanentDistrict },
  { key: 'permanentMunicipality', label: 'Municipality',  group: 'Identity',  get: ({ candidate }) => candidate.permanentMunicipality },
  { key: 'permanentWardNo',   label: 'Ward No.',          group: 'Identity',  get: ({ candidate }) => candidate.permanentWardNo },

  // Passport
  { key: 'passportNumber',    label: 'Passport No.',      group: 'Passport',  get: ({ candidate, passport }) => passport?.passportNumber || candidate.passportNumber },
  { key: 'passportExpiry',    label: 'Passport Expiry',   group: 'Passport',  get: ({ passport }) => fmtDate(passport?.expiryDate) },
  { key: 'passportIssued',    label: 'Passport Issued',   group: 'Passport',  get: ({ passport }) => fmtDate(passport?.issueDate) },
  { key: 'issuedDistrict',    label: 'Passport Issued District', group: 'Passport', get: ({ passport }) => passport?.issuedDistrict },

  // Demand
  { key: 'demandCountry',     label: 'Destination',       group: 'Demand',    get: ({ candidate, demand }) => demand?.employerCountry || candidate.demandCountry || candidate.desiredCountry },
  { key: 'employerCompany',   label: 'Employer',          group: 'Demand',    get: ({ demand }) => demand?.employerCompanyName },
  { key: 'jobCategory',       label: 'Job Category',      group: 'Demand',    get: ({ candidate, demand }) => candidate.demandJobCategory || demand?.jobCategory || candidate.desiredJobCategory },
  { key: 'demandLetterNumber',label: 'Demand Letter No.', group: 'Demand',    get: ({ demand }) => demand?.demandLetterNumber },

  // Medical
  { key: 'medicalResult',     label: 'Medical Result',    group: 'Medical',   get: ({ medical }) => medical?.result },
  { key: 'medicalConducted',  label: 'Medical Date',      group: 'Medical',   get: ({ medical }) => fmtDate(medical?.conductedDate) },
  { key: 'medicalExpiry',     label: 'Medical Expiry',    group: 'Medical',   get: ({ medical }) => fmtDate(medical?.reportExpiryDate) },
  { key: 'medicalCenter',     label: 'Medical Center',    group: 'Medical',   get: ({ medical }) => medical?.examCenter },

  // Compliance
  { key: 'insurancePolicy',   label: 'Insurance Policy',  group: 'Compliance', get: ({ insurance }) => insurance?.insurancePolicyNumber },
  { key: 'ssfReceipt',        label: 'SSF Receipt',       group: 'Compliance', get: ({ insurance }) => insurance?.ssfReceiptNumber },
  { key: 'welfarePaid',       label: 'Welfare Fund Paid', group: 'Compliance', get: ({ insurance }) => insurance?.welfareFundPaid === true ? 'Yes' : insurance?.welfareFundPaid === false ? 'No' : '' },
  { key: 'welfareReceipt',    label: 'Welfare Receipt',   group: 'Compliance', get: ({ insurance }) => insurance?.welfareFundReceiptNumber },

  // Visa / Malaysia
  { key: 'visaNumber',        label: 'Visa No.',          group: 'Visa & Malaysia', get: ({ candidate }) => candidate.visaNumber },
  { key: 'visaStampedDate',   label: 'Visa Stamped',      group: 'Visa & Malaysia', get: ({ candidate }) => fmtDate(candidate.visaStampedDate) },
  { key: 'visaExpiry',        label: 'Visa Expiry',       group: 'Visa & Malaysia', get: ({ candidate }) => fmtDate(candidate.visaExpiryDate) },
  { key: 'callingLetterNumber', label: 'Calling Letter No.', group: 'Visa & Malaysia', get: ({ candidate }) => candidate.callingLetterNumber },
  { key: 'vlnNumber',         label: 'VLN No.',           group: 'Visa & Malaysia', get: ({ candidate }) => candidate.vlnNumber },
  { key: 'plksNumber',        label: 'PLKS No.',          group: 'Visa & Malaysia', get: ({ candidate }) => candidate.plksNumber },

  // DoFE
  { key: 'feimsRegNo',        label: 'FEIMS Reg No.',     group: 'DoFE',      get: ({ candidate }) => candidate.feimsRegistrationNumber },
  { key: 'shramSwukriti',     label: 'Shram Swukriti No.',group: 'DoFE',      get: ({ candidate }) => candidate.shramSwikritiNumber },
  { key: 'purbaSwukriti',     label: 'Purba Swukriti No.',group: 'DoFE',      get: ({ candidate }) => candidate.purbaSwukritiNumber },
  { key: 'orientationCert',   label: 'Orientation Cert.', group: 'DoFE',      get: ({ orientation }) => orientation?.certificateNumber },
  { key: 'orientationStatus', label: 'Orientation Status',group: 'DoFE',      get: ({ orientation }) => orientation?.completionStatus },

  // Departure
  { key: 'flightDate',        label: 'Flight Date',       group: 'Departure', get: ({ candidate }) => fmtDate(candidate.flightDate) },
  { key: 'flightNumber',      label: 'Flight No.',        group: 'Departure', get: ({ candidate }) => candidate.flightNumber },
  { key: 'actualDeparture',   label: 'Actual Departure',  group: 'Departure', get: ({ candidate }) => fmtDate(candidate.actualDepartureDate) },

  // Workflow
  { key: 'status',            label: 'Status',            group: 'Workflow',  get: ({ candidate }) => candidate.status },
  { key: 'registeredAt',      label: 'Registered',        group: 'Workflow',  get: ({ candidate }) => fmtDate(candidate.registeredAt) },
  { key: 'agentName',         label: 'Agent',             group: 'Workflow',  get: ({ candidate }) => candidate.agentId?.name },
];

const FIELDS_BY_KEY = Object.fromEntries(FIELDS.map(f => [f.key, f]));

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = {
  feims: {
    label: 'FEIMS submission',
    keys: ['fullName', 'dateOfBirth', 'gender', 'nationalIdNumber', 'phone',
           'permanentDistrict', 'permanentMunicipality', 'permanentWardNo',
           'passportNumber', 'demandCountry', 'jobCategory',
           'feimsRegNo', 'visaNumber', 'vlnNumber'],
  },
  departure: {
    label: 'Departure manifest',
    keys: ['fullName', 'passportNumber', 'demandCountry', 'employerCompany',
           'flightDate', 'flightNumber', 'actualDeparture'],
  },
  medical: {
    label: 'Medical batch',
    keys: ['fullName', 'dateOfBirth', 'gender', 'passportNumber', 'phone',
           'medicalCenter', 'medicalResult', 'medicalExpiry'],
  },
  all:    { label: 'All fields', keys: FIELDS.map(f => f.key) },
  custom: { label: 'Custom',     keys: [] },
};

const DEFAULT_PRESET = 'departure';

// ─── CSV generator (zero-dep) ─────────────────────────────────────────────────

const escapeCsv = (v) => {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function buildCsv(rows, fields) {
  const header = fields.map(f => escapeCsv(f.label)).join(',');
  const body = rows.map(row =>
    fields.map(f => escapeCsv(f.get(row))).join(',')
  );
  return '﻿' + [header, ...body].join('\r\n'); // BOM for Excel
}

function downloadBlob(content, filename, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── XLSX generator (dynamic import to keep main bundle slim) ────────────────

async function buildXlsx(rows, fields) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Candidates');
  ws.columns = fields.map(f => ({ header: f.label, key: f.key, width: Math.max(12, f.label.length + 2) }));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };

  for (const row of rows) {
    const record = {};
    for (const f of fields) record[f.key] = f.get(row);
    ws.addRow(record);
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const BulkExportModal = ({ isOpen, onClose, selectedIds }) => {
  const [preset, setPreset]   = useState(DEFAULT_PRESET);
  const [picked, setPicked]   = useState(() => new Set(PRESETS[DEFAULT_PRESET].keys));
  const [format, setFormat]   = useState('csv');
  const [filename, setFilename] = useState(`candidates-${new Date().toISOString().slice(0, 10)}`);
  const [busy, setBusy]       = useState(false);

  const groups = useMemo(() => {
    const map = new Map();
    for (const f of FIELDS) {
      if (!map.has(f.group)) map.set(f.group, []);
      map.get(f.group).push(f);
    }
    return [...map.entries()];
  }, []);

  if (!isOpen) return null;

  const applyPreset = (key) => {
    setPreset(key);
    if (key !== 'custom') setPicked(new Set(PRESETS[key].keys));
  };

  const togglePicked = (key) => {
    setPicked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setPreset('custom');
  };

  const toggleGroup = (groupFields) => {
    const allOn = groupFields.every(f => picked.has(f.key));
    setPicked(prev => {
      const next = new Set(prev);
      for (const f of groupFields) {
        allOn ? next.delete(f.key) : next.add(f.key);
      }
      return next;
    });
    setPreset('custom');
  };

  const handleExport = async () => {
    if (!picked.size) {
      showToast.error('Select at least one field.');
      return;
    }
    setBusy(true);
    try {
      const res = await candidatesApi.exportBatch(selectedIds);
      const rows = res.data?.rows || [];
      if (!rows.length) {
        showToast.error('No exportable records found.');
        return;
      }

      const fields = FIELDS.filter(f => picked.has(f.key));
      const safeName = (filename || 'candidates').replace(/[^a-z0-9_\-]+/gi, '_');

      if (format === 'xlsx') {
        const blob = await buildXlsx(rows, fields);
        downloadBlob(blob, `${safeName}.xlsx`);
      } else {
        const csv = buildCsv(rows, fields);
        downloadBlob(csv, `${safeName}.csv`, 'text/csv;charset=utf-8');
      }

      showToast.success(`Exported ${rows.length} candidate${rows.length === 1 ? '' : 's'}`);
      onClose();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Export candidates</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedIds.length} candidate{selectedIds.length === 1 ? '' : 's'} selected · {picked.size} field{picked.size === 1 ? '' : 's'} chosen
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Presets */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Preset</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    preset === key
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Field groups */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Fields</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groups.map(([group, fields]) => {
                const allOn = fields.every(f => picked.has(f.key));
                const someOn = fields.some(f => picked.has(f.key));
                return (
                  <div key={group} className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
                    <button
                      onClick={() => toggleGroup(fields)}
                      className="flex items-center gap-2 mb-2 w-full text-left group"
                    >
                      <input
                        type="checkbox"
                        checked={allOn}
                        ref={(el) => { if (el) el.indeterminate = !allOn && someOn; }}
                        onChange={() => toggleGroup(fields)}
                        onClick={e => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/30"
                      />
                      <span className="text-xs font-semibold text-gray-700 group-hover:text-primary">{group}</span>
                    </button>
                    <div className="space-y-1 pl-1">
                      {fields.map(f => (
                        <label key={f.key} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={picked.has(f.key)}
                            onChange={() => togglePicked(f.key)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/30"
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format + filename */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Format</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('csv')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    format === 'csv'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  <FileText size={13} /> CSV
                </button>
                <button
                  onClick={() => setFormat('xlsx')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    format === 'xlsx'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  <FileSpreadsheet size={13} /> XLSX
                </button>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Filename</p>
              <input
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="candidates-export"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={busy || !picked.size}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {busy
              ? <><Loader2 size={13} className="animate-spin" /> Building…</>
              : <><Download size={13} /> Download</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkExportModal;
