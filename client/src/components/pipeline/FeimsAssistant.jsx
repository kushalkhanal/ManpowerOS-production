import { useState, useCallback } from 'react';
import { Copy, Check, Globe, FileText, AlertTriangle, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import feimsApi from '../../api/feims.api.js';

const FEIMS_URL = 'https://feims.dofe.gov.np';

/**
 * FEIMS Form Assistant
 *
 * Presents all FEIMS-required data in a copy-friendly panel so staff can
 * enter worker details into the DoFE FEIMS portal without transcription errors.
 * Also shows which documents need to be uploaded and lets staff record the
 * FEIMS registration number once obtained.
 *
 * Props:
 *   candidateId {string}
 */
export function FeimsAssistant({ candidateId }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('data');
  const [copied, setCopied] = useState(null);
  const [regForm, setRegForm] = useState({ feimsRegistrationNumber: '', dofeFileNumber: '' });
  const [regSaved, setRegSaved] = useState(false);

  const { data: packet, isLoading, error } = useQuery({
    queryKey: ['feims-packet', candidateId],
    queryFn: () => feimsApi.getPacket(candidateId).then(r => r.data.data),
    enabled: !!candidateId
  });

  const registrationMutation = useMutation({
    mutationFn: (data) => feimsApi.updateRegistration(candidateId, data),
    onSuccess: () => {
      setRegSaved(true);
      setTimeout(() => setRegSaved(false), 3000);
      qc.invalidateQueries({ queryKey: ['feims-packet', candidateId] });
    }
  });

  const copyToClipboard = useCallback(async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard not available in some browsers/contexts
    }
  }, []);

  if (isLoading) return (
    <div className="flex items-center gap-2 p-6 text-gray-500 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading FEIMS data…
    </div>
  );

  if (error) return (
    <div className="p-4 text-red-600 text-sm bg-red-50 rounded-xl border border-red-100">
      {error.message || 'Failed to load FEIMS packet'}
    </div>
  );

  if (!packet) return null;

  const {
    feimsData, missingFields, documentChecklist,
    submissionReady, currentFeimsStatus, countryRules
  } = packet;

  const tabs = [
    { id: 'data',      label: 'Form Data',    count: missingFields.length > 0 ? missingFields.length : null },
    { id: 'documents', label: 'Documents',    count: documentChecklist.filter(d => d.required && !d.available).length || null },
    { id: 'status',    label: 'FEIMS Status', count: null }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-cyan-50 border-b border-cyan-100 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">FEIMS Form Assistant</h3>
            <p className="text-xs text-cyan-700 mt-0.5">
              Copy data below into the DoFE FEIMS portal
            </p>
          </div>
        </div>
        <a
          href={FEIMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-900 font-medium shrink-0"
        >
          Open FEIMS
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Current FEIMS status banner */}
      {currentFeimsStatus.registrationNumber ? (
        <div className="px-5 py-2.5 bg-green-50 border-b border-green-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-700 font-medium">
            FEIMS Reg. No.: <span className="font-bold">{currentFeimsStatus.registrationNumber}</span>
            {currentFeimsStatus.dofeFileNumber && (
              <> | DoFE File: <span className="font-bold">{currentFeimsStatus.dofeFileNumber}</span></>
            )}
          </span>
        </div>
      ) : (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-700">Not yet registered in FEIMS</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 py-3 px-1 mr-4 text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count ? (
              <span className="inline-flex items-center justify-center w-4 h-4 text-xs bg-red-100 text-red-700 rounded-full">
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab: Form Data */}
      {activeTab === 'data' && (
        <div className="divide-y divide-gray-50">
          {missingFields.length > 0 && (
            <div className="px-5 py-3 bg-red-50 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                <span className="font-semibold">Missing fields: </span>
                {missingFields.join(', ')}
              </p>
            </div>
          )}
          {Object.entries(feimsData)
            .filter(([, v]) => v !== null)
            .map(([key, value]) => (
              <FieldRow
                key={key}
                fieldKey={key}
                value={String(value)}
                copied={copied}
                onCopy={copyToClipboard}
              />
            ))
          }
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <ul className="divide-y divide-gray-50">
          {documentChecklist.map(doc => (
            <li key={doc.id} className="px-5 py-3 flex items-start gap-3">
              {doc.available
                ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                : <XCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${doc.required ? 'text-red-400' : 'text-gray-300'}`} />
              }
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${doc.available ? 'text-gray-700' : doc.required ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {doc.label}
                  {!doc.required && <span className="ml-1 text-xs text-gray-400">(optional)</span>}
                </p>
                {doc.detail && <p className="text-xs text-gray-500 mt-0.5">{doc.detail}</p>}
              </div>
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-600 hover:text-cyan-800 flex items-center gap-1 shrink-0"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Tab: FEIMS Status */}
      {activeTab === 'status' && (
        <div className="p-5 space-y-4">
          {/* Record registration number */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Record FEIMS Registration
            </h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">FEIMS Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. FEIMS-2081-XXXXXX"
                  value={regForm.feimsRegistrationNumber}
                  onChange={e => setRegForm(f => ({ ...f, feimsRegistrationNumber: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">DoFE File Number (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. DoFE/081/XXXXX"
                  value={regForm.dofeFileNumber}
                  onChange={e => setRegForm(f => ({ ...f, dofeFileNumber: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <button
                disabled={!regForm.feimsRegistrationNumber || registrationMutation.isPending}
                onClick={() => registrationMutation.mutate({
                  feimsRegistrationNumber: regForm.feimsRegistrationNumber,
                  dofeFileNumber: regForm.dofeFileNumber || undefined,
                  feimsSubmittedAt: new Date().toISOString(),
                  feimsApprovalStatus: 'pending'
                })}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {registrationMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : regSaved
                    ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
                    : 'Save Registration'
                }
              </button>
            </div>
          </div>

          {/* Country notes */}
          {countryRules?.notes && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 mb-1">Country-Specific Notes</p>
              <p className="text-xs text-amber-800">{countryRules.notes}</p>
              {countryRules.requiresTradeTest && (
                <p className="text-xs text-amber-700 mt-1 font-medium">⚠ Trade test required for this destination</p>
              )}
              {countryRules.requiresLanguageTest && (
                <p className="text-xs text-amber-700 mt-1 font-medium">
                  ⚠ Language test required: {countryRules.languageTestName}
                </p>
              )}
              {countryRules.requiresEsticker && (
                <p className="text-xs text-amber-700 mt-1 font-medium">⚠ E-sticker / PLKS required</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submission ready footer */}
      {submissionReady && !currentFeimsStatus.registrationNumber && (
        <div className="px-5 py-3 bg-cyan-50 border-t border-cyan-100">
          <p className="text-xs text-cyan-800 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
            All data and documents ready — submit in FEIMS portal, then record the registration number above.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Field row with copy button ───────────────────────────────────────────────

function FieldRow({ fieldKey, value, copied, onCopy }) {
  const label = FIELD_LABELS[fieldKey] || fieldKey.replace(/_/g, ' ');
  const isCopied = copied === fieldKey;

  return (
    <div className="px-5 py-2.5 flex items-center gap-3 hover:bg-gray-50 group">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm text-gray-900 font-medium truncate">{value}</p>
      </div>
      <button
        onClick={() => onCopy(value, fieldKey)}
        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-600 transition-all"
        title="Copy to clipboard"
      >
        {isCopied
          ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</>
          : <><Copy className="w-3.5 h-3.5" /> Copy</>
        }
      </button>
    </div>
  );
}

const FIELD_LABELS = {
  fullName:               'Full Name (English)',
  fullNameNepali:         'Full Name (Nepali)',
  dateOfBirthAD:          'Date of Birth (AD)',
  dateOfBirthBS:          'Date of Birth (BS)',
  gender:                 'Gender',
  nationalIdNumber:       'Citizenship / NID Number',
  phone:                  'Phone Number',
  permanentProvince:      'Permanent Province',
  permanentDistrict:      'Permanent District',
  permanentMunicipality:  'Municipality / VDC',
  permanentWardNo:        'Ward Number',
  passportNumber:         'Passport Number',
  passportExpiryDate:     'Passport Expiry Date',
  passportIssuedDistrict: 'Passport Issued District',
  destinationCountry:     'Destination Country',
  jobCategory:            'Job Category',
  employerCompany:        'Employer Company',
  demandLetterNumber:     'Demand Letter Number',
  purbaSwukritiNumber:    'Purba Swukriti Number',
  medicalCenter:          'Medical Center',
  medicalResult:          'Medical Result',
  medicalConductedDate:   'Medical Conducted Date',
  orientationCenter:      'Orientation Center',
  orientationCertificate: 'Orientation Certificate No.',
  insurancePolicyNumber:  'Insurance Policy Number',
  ssfRegistrationNumber:  'SSF Registration Number'
};

export default FeimsAssistant;
