import { useState, useEffect, useRef } from 'react';
import { Check, X, Upload, ExternalLink, RefreshCw } from 'lucide-react';
import { sharedDocumentsApi, candidatesApi, jobDemandApi } from '../api';
import { getRegionForCountry, REGION } from '../domain/workflow';
import { isValidFileSize, isValidFileType } from '../utils/validation';

// ─── Document spec ────────────────────────────────────────────────────────────
// Three upload kinds (`source`):
//   'shared'    → SharedDocument storage (uses sharedDocumentsApi)
//   'candidate' → Candidate record field (uses candidatesApi.update)
//   'demand'    → JobDemand record field (uses jobDemandApi.update); needs demand
//   null        → not uploadable; show actionLabel/actionPath instead
//
// For 'candidate' / 'demand', `field` is the multipart form field name the
// server multer middleware expects.

const COMMON_DOCS = [
  { id: 'passportScan',    label: 'Passport scan',           category: 'Identity',    source: 'shared',    docType: 'passport' },
  { id: 'passportPhoto',   label: 'Passport photo',          category: 'Identity',    source: 'shared',    docType: 'photo' },
  { id: 'medicalReport',   label: 'Medical fitness report',  category: 'Medical',     source: 'shared',    docType: 'medical' },
  { id: 'orientationCert', label: 'Orientation certificate', category: 'Orientation', source: 'shared',    docType: 'orientation' },
  { id: 'insuranceReceipt',label: 'Insurance receipt',       category: 'Compliance',  source: null,
    actionLabel: 'Update in timeline' },
  { id: 'demandLetter',    label: 'Demand letter',           category: 'Demand',      source: 'demand',    field: 'demandLetter' },
  { id: 'powerOfAttorney', label: 'Power of Attorney',       category: 'Demand',      source: 'demand',    field: 'powerOfAttorney' },
  { id: 'feimsDoc',        label: 'FEIMS document',          category: 'FEIMS',       source: 'candidate', field: 'feimsFile' },
];

const GULF_DOCS = [
  { id: 'embassyAttestedDemand', label: 'Embassy-attested demand', category: 'Demand', source: 'demand', field: 'embassyAttested' },
  { id: 'callingVisa',    label: 'Calling visa letter',     category: 'Travel',      source: 'shared', docType: 'stamping' },
  { id: 'visaStamp',      label: 'Visa stamp copy',         category: 'Travel',      source: 'shared', docType: 'visa' },
];

const MALAYSIA_DOCS = [
  { id: 'vlnLetter',      label: 'VLN / VDR calling letter',category: 'Travel',      source: null,
    actionLabel: 'Update in timeline' },
  { id: 'plksSticker',    label: 'PLKS e-sticker',          category: 'Travel',      source: null,
    actionLabel: 'Update in timeline' },
];

// ─── Resolve URLs from all sources ───────────────────────────────────────────

function resolveDocUrls(kanbanData, sharedDocs) {
  const { candidate, passport, demand, columns } = kanbanData || {};
  const dofe = columns?.find(c => c.id === 'dofe')?.data;
  const ins  = columns?.find(c => c.id === 'insurance')?.data;
  const med  = columns?.find(c => c.id === 'medical')?.data;

  return {
    passportScan:          sharedDocs?.passportFile?.url    || passport?.scannedImageUrl           || null,
    passportPhoto:         sharedDocs?.photoFile?.url                                              || null,
    medicalReport:         sharedDocs?.medicalFile?.url     || med?.reportFileUrl                  || null,
    orientationCert:       sharedDocs?.orientationFile?.url || dofe?.orientation?.certificateFileUrl || null,
    insuranceReceipt:      ins?.insurancePaidReceiptUrl                                            || null,
    demandLetter:          demand?.demandLetterFileUrl                                             || null,
    powerOfAttorney:       demand?.powerOfAttorneyFileUrl                                          || null,
    embassyAttestedDemand: demand?.embassyAttestedDemandUrl                                        || null,
    callingVisa:           sharedDocs?.stampingFile?.url    || candidate?.callingLetterFileUrl      || null,
    visaStamp:             sharedDocs?.visaFile?.url        || candidate?.visaFileUrl               || null,
    vlnLetter:             candidate?.vlnFileUrl                                                   || null,
    plksSticker:           candidate?.plksFileUrl                                                  || null,
    feimsDoc:              candidate?.feimsFileUrl                                                 || null,
  };
}

function groupByCategory(docs) {
  const map = {};
  for (const doc of docs) {
    (map[doc.category] = map[doc.category] || []).push(doc);
  }
  return Object.entries(map);
}

// ─── Single document row ──────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

const DocRow = ({ spec, url, uploading, error, onUpload, demand }) => {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!isValidFileType(file, ALLOWED_TYPES)) {
      onUpload(null, 'Invalid file type. Use JPG, PNG, PDF or WebP.');
      return;
    }
    if (!isValidFileSize(file, MAX_SIZE)) {
      onUpload(null, 'File too large (max 10 MB).');
      return;
    }
    onUpload(file);
  };

  const isUploadable = spec.source === 'shared'
    || spec.source === 'candidate'
    || (spec.source === 'demand' && !!demand?._id);

  const showOpenDemandFallback = spec.source === 'demand' && !demand?._id;

  return (
    <div>
      <div className="flex items-center gap-3 py-2.5">
        {/* Status dot */}
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          url ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          {url
            ? <Check size={10} className="text-green-600" strokeWidth={3} />
            : <X size={10} className="text-gray-400" strokeWidth={2.5} />
          }
        </div>

        {/* Label */}
        <span className={`text-sm flex-1 min-w-0 ${url ? 'text-gray-800' : 'text-gray-500'}`}>
          {spec.label}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              View <ExternalLink size={9} />
            </a>
          )}

          {isUploadable && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleChange}
              />
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                  uploading
                    ? 'text-gray-400 cursor-wait'
                    : url
                    ? 'text-gray-500 hover:text-blue-600'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                {uploading ? (
                  <><RefreshCw size={10} className="animate-spin" /> Uploading…</>
                ) : url ? (
                  <><Upload size={10} /> Replace</>
                ) : (
                  <><Upload size={10} /> Upload</>
                )}
              </button>
            </>
          )}

          {showOpenDemandFallback && (
            <span className="text-[10px] text-gray-400 italic">Assign demand first</span>
          )}

          {spec.source === null && !url && spec.actionLabel && (
            <span className="text-[10px] text-gray-400 italic">{spec.actionLabel}</span>
          )}
        </div>
      </div>

      {error && (
        <p className="ml-8 text-[10px] text-red-500 -mt-1 pb-1">{error}</p>
      )}
    </div>
  );
};

// ─── Main DocumentVault component ─────────────────────────────────────────────

const DocumentVault = ({ candidateId, kanbanData, onUploaded }) => {
  const [sharedDocs, setSharedDocs]     = useState(null);
  const [loadingDocs, setLoadingDocs]   = useState(true);
  const [uploading, setUploading]       = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  useEffect(() => {
    if (candidateId) fetchSharedDocs();
  }, [candidateId]);

  const fetchSharedDocs = async () => {
    try {
      setLoadingDocs(true);
      const res = await sharedDocumentsApi.getDocuments('candidate', candidateId);
      setSharedDocs(res.data);
    } catch {
      setSharedDocs(null);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUpload = async (spec, file, errorMsg, demand, onChanged) => {
    const key = spec.id;
    if (errorMsg) {
      setUploadErrors(prev => ({ ...prev, [key]: errorMsg }));
      return;
    }
    if (!file) return;

    setUploading(prev => ({ ...prev, [key]: true }));
    setUploadErrors(prev => ({ ...prev, [key]: null }));
    try {
      if (spec.source === 'shared') {
        const res = await sharedDocumentsApi.uploadDocument('candidate', candidateId, spec.docType, file);
        setSharedDocs(res.data);
      } else if (spec.source === 'candidate') {
        await candidatesApi.update(candidateId, { [spec.field]: file });
        onChanged?.();
      } else if (spec.source === 'demand') {
        if (!demand?._id) throw new Error('No demand assigned to this candidate.');
        await jobDemandApi.update(demand._id, { [spec.field]: file });
        onChanged?.();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed. Try again.';
      setUploadErrors(prev => ({ ...prev, [key]: msg }));
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  if (!kanbanData) return null;

  const { candidate, demand } = kanbanData;
  const country  = candidate?.demandCountry || candidate?.desiredCountry;
  const region   = getRegionForCountry(country);
  const isMalaysia = region === REGION.MALAYSIA;

  const vaultDocs = [...COMMON_DOCS, ...(isMalaysia ? MALAYSIA_DOCS : GULF_DOCS)];
  const docUrls   = resolveDocUrls(kanbanData, sharedDocs);

  const collected = vaultDocs.filter(d => docUrls[d.id]).length;
  const total     = vaultDocs.length;
  const pct       = Math.round((collected / total) * 100);

  const progressColor = pct < 40 ? 'bg-red-400' : pct < 75 ? 'bg-amber-400' : 'bg-green-500';

  return (
    <div>
      {/* Completeness bar */}
      <div className="flex items-center gap-3 pt-3 pb-4">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs font-bold tabular-nums ${
          pct < 40 ? 'text-red-500' : pct < 75 ? 'text-amber-600' : 'text-green-600'
        }`}>
          {collected} / {total}
        </span>
      </div>

      {loadingDocs ? (
        <div className="py-4 text-center text-sm text-gray-400">Loading documents…</div>
      ) : (
        groupByCategory(vaultDocs).map(([category, docs]) => (
          <div key={category} className="mb-4 last:mb-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1 pb-1 border-b border-gray-50">
              {category}
            </p>
            <div className="divide-y divide-gray-50">
              {docs.map(spec => (
                <DocRow
                  key={spec.id}
                  spec={spec}
                  url={docUrls[spec.id]}
                  uploading={uploading[spec.id]}
                  error={uploadErrors[spec.id]}
                  onUpload={(file, err) => handleUpload(spec, file, err, demand, onUploaded)}
                  demand={demand}
                />
              ))}
            </div>
          </div>
        ))
      )}

      <p className="mt-3 text-[10px] text-gray-400">
        Supports JPG, PNG, PDF, WebP · Max 10 MB · Uploads stored on the candidate record
      </p>
    </div>
  );
};

export default DocumentVault;
