import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { sharedDocumentsApi } from "../../api";
import { showToast } from "../ToastProvider";

const DOC_CHECKLIST = [
  { key: 'passport',      label: 'Passport copy',          required: true  },
  { key: 'citizenship',   label: 'Citizenship copy',       required: true  },
  { key: 'photo',         label: 'Passport photos (4x)',   required: true  },
  { key: 'pcc',           label: 'Police Clearance (PCC)', required: true  },
  { key: 'medical',       label: 'Medical fitness copy',   required: true  },
  { key: 'insuranceCopy', label: 'Insurance card copy',    required: true  },
  { key: 'contract',      label: 'Employment contract',    required: true  },
  { key: 'biodata',       label: 'Bio-data form',          required: false },
  { key: 'mrp',           label: 'MRP photo',              required: false },
];

const DocumentationChecklist = ({ candidate, passport }) => {
  const [sharedDoc, setSharedDoc] = useState(null);
  const [uploading, setUploading] = useState({});
  const fileRefs = useRef({});

  const entityType = passport?._id ? 'passport' : 'candidate';
  const entityId   = passport?._id || candidate?._id;

  useEffect(() => {
    if (!entityId) return;
    sharedDocumentsApi.getDocuments(entityType, entityId)
      .then(r => setSharedDoc(r.data))
      .catch(() => showToast.error("Failed to load documents"));
  }, [entityType, entityId]);

  const getUrl = (key) => sharedDoc?.[`${key}File`]?.url || null;

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploading(p => ({ ...p, [key]: true }));
    try {
      const r = await sharedDocumentsApi.uploadDocument(entityType, entityId, key, file);
      setSharedDoc(r.data);
    } catch {
      showToast.error("Upload failed");
    } finally {
      setUploading(p => ({ ...p, [key]: false }));
    }
  };

  const required = DOC_CHECKLIST.filter(d => d.required);
  const optional = DOC_CHECKLIST.filter(d => !d.required);
  const doneReq  = required.filter(d => getUrl(d.key)).length;
  const doneOpt  = optional.filter(d => getUrl(d.key)).length;
  const allDone  = doneReq === required.length;

  const renderRow = ({ key, label, required: req }) => {
    const url  = getUrl(key);
    const busy = uploading[key];
    return (
      <li key={key} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${url ? 'bg-emerald-50/60' : 'bg-gray-50 hover:bg-gray-100/70'}`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${url ? 'bg-emerald-500 border-emerald-500' : req ? 'border-gray-300 bg-white' : 'border-dashed border-gray-300 bg-white'}`}>
          {url && <Check size={11} className="text-white" strokeWidth={3} />}
        </span>
        <span className={`flex-1 text-xs font-medium ${url ? 'text-emerald-800' : req ? 'text-gray-700' : 'text-gray-400'}`}>
          {label}
        </span>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-medium text-emerald-600 hover:text-emerald-800 hover:underline shrink-0 px-1.5 py-0.5 bg-emerald-100 rounded">
            View
          </a>
        )}
        <input
          type="file" accept="image/*,application/pdf" className="hidden"
          id={`doc-${key}-${entityId}`}
          onChange={e => { const f = e.target.files[0]; if (f) handleUpload(key, f); e.target.value = ''; }}
        />
        <label htmlFor={`doc-${key}-${entityId}`}
          className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
            busy   ? 'text-gray-400 bg-gray-200 cursor-wait' :
            url    ? 'text-gray-400 bg-white border border-gray-200 hover:border-primary hover:text-primary' :
            req    ? 'text-white bg-primary hover:bg-primary-700' :
                     'text-gray-500 bg-white border border-gray-200 hover:border-primary hover:text-primary'
          }`}>
          {busy ? '…' : url ? 'Replace' : 'Upload'}
        </label>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${allDone ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-100'}`}>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${allDone ? 'bg-emerald-500' : 'bg-amber-400'}`}>
          {allDone
            ? <Check size={16} className="text-white" strokeWidth={3} />
            : <span className="text-white text-xs font-bold">{doneReq}/{required.length}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${allDone ? 'text-emerald-800' : 'text-amber-800'}`}>
            {allDone ? 'All required documents ready' : `${required.length - doneReq} required document${required.length - doneReq === 1 ? '' : 's'} missing`}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex-1 h-1 bg-white/70 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-amber-400'}`}
                style={{ width: `${Math.round((doneReq / required.length) * 100)}%` }} />
            </div>
            <span className={`text-[10px] font-medium ${allDone ? 'text-emerald-600' : 'text-amber-600'}`}>
              {doneReq}/{required.length}
            </span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 px-1">Required</p>
        <ul className="space-y-1">{required.map(renderRow)}</ul>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 px-1">
          Optional · {doneOpt}/{optional.length}
        </p>
        <ul className="space-y-1">{optional.map(renderRow)}</ul>
      </div>

      <p className="text-[10px] text-gray-400 pt-1">
        Documents uploaded in the passport pool are shared — they appear here automatically.
      </p>
    </div>
  );
};

export default DocumentationChecklist;
