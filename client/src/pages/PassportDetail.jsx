import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { usePassports } from '../hooks/usePassports';
import StatusChangeModal from '../components/StatusChangeModal';
import EditPassportModal from '../components/EditPassportModal';
import SharedDocumentsPanel from '../components/SharedDocumentsPanel';
import { ArrowLeft, Pencil, Settings2 } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CUSTODY_COLORS = {
  with_agency:           'bg-blue-100 text-blue-700',
  returned_to_candidate: 'bg-emerald-100 text-emerald-700',
  submitted_embassy:     'bg-amber-100 text-amber-700',
  lost:                  'bg-red-100 text-red-700',
};

const CUSTODY_LABELS = {
  with_agency:           'With Agency',
  returned_to_candidate: 'Returned to Candidate',
  submitted_embassy:     'At Embassy',
  lost:                  'Lost',
};

const ACTION_LABELS = {
  collected:      'Collected',
  status_changed: 'Status Changed',
  edited:         'Edited',
  deleted:        'Deleted',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  : '—';

const daysUntil = (d) => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className={`mt-0.5 text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

function PanelCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      {title && <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</h2>}
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PassportDetail = () => {
  const { id } = useParams();
  const { getPassportById, loading } = usePassports();
  const [passport, setPassport]     = useState(null);
  const [logs, setLogs]             = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [searchParams, setSearchParams]       = useSearchParams();

  const loadPassport = async () => {
    try {
      const data = await getPassportById(id);
      setPassport(data.passport);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error loading passport:', err);
    }
  };

  useEffect(() => { loadPassport(); }, [id]);

  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setShowEditModal(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  if (loading && !passport) {
    return (
      <div className="px-4 py-6 sm:px-6 max-w-5xl mx-auto space-y-4">
        <div className="h-10 bg-gray-50 rounded-xl border border-gray-100 animate-pulse w-48" />
        <div className="h-48 bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
        <Link to="/passports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Back
        </Link>
        <p className="text-gray-500 text-sm">Passport not found.</p>
      </div>
    );
  }

  const expDays    = daysUntil(passport.expiryDate);
  const isExpiring = expDays !== null && expDays > 0 && expDays <= 60;
  const isExpired  = expDays !== null && expDays <= 0;

  return (
    <div className="px-4 py-6 sm:px-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        to="/passports"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4 transition-colors"
      >
        <ArrowLeft size={13} /> Passport Pool
      </Link>

      {/* Sticky header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{passport.fullName}</h1>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              CUSTODY_COLORS[passport.custodyStatus] || 'bg-gray-100 text-gray-600'
            }`}>
              {CUSTODY_LABELS[passport.custodyStatus] || passport.custodyStatus}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-400 font-mono">{passport.passportNumber}</p>
          {(isExpiring || isExpired) && (
            <p className={`mt-1 text-xs font-semibold ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
              {isExpired ? `Passport expired ${-expDays}d ago` : `Expires in ${expDays}d`}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Settings2 size={12} /> Status & Sponsor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-4">
          <PanelCard title="Identity">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Full Name"       value={passport.fullName} />
              <InfoRow label="Passport Number" value={passport.passportNumber} mono />
              <InfoRow label="Personal No."   value={passport.personalNumber}  mono />
              <InfoRow label="Date of Birth"  value={fmtDate(passport.dateOfBirth)} />
              <InfoRow label="Issue Date"     value={fmtDate(passport.issueDate)} />
              <InfoRow label="Expiry Date"    value={fmtDate(passport.expiryDate)} />
              {passport.expiryDateBS && (
                <InfoRow label="Expiry (BS)"  value={passport.expiryDateBS} />
              )}
              <InfoRow label="Issued District" value={passport.issuedDistrict} />
              <InfoRow label="Phone"
                value={passport.contactPhone || passport.candidateId?.phone} />
              {passport.candidateId && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-gray-400">Candidate</dt>
                  <dd className="mt-0.5 text-sm">
                    <Link
                      to={`/candidates/${passport.candidateId._id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {passport.candidateId.fullName}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </PanelCard>

          <PanelCard title="Custody & Assignment">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Status"        value={CUSTODY_LABELS[passport.custodyStatus] || passport.custodyStatus} />
              <InfoRow label="Location"      value={passport.location} />
              <InfoRow label="Sponsor Name"  value={passport.sponsorName} />
              <InfoRow label="Sponsor Phone" value={passport.sponsorNumber} />
              <InfoRow label="Assigned Staff" value={passport.assignedStaff} />
            </dl>
            {passport.notes && (
              <p className="mt-3 text-xs text-gray-500 border-t border-gray-50 pt-3">{passport.notes}</p>
            )}
          </PanelCard>

          <PanelCard title="Collection Info">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Collected By" value={passport.collectedBy?.name} />
              <InfoRow label="Collected At" value={fmtDateTime(passport.collectedAt)} />
              {passport.returnedBy && (
                <>
                  <InfoRow label="Returned By" value={passport.returnedBy?.name} />
                  <InfoRow label="Returned At" value={fmtDateTime(passport.returnedAt)} />
                </>
              )}
            </dl>
          </PanelCard>

          {/* Audit log */}
          <PanelCard title="Audit Log">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400">No activity logged yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
                <div className="space-y-5">
                  {logs.map((log, i) => (
                    <div key={log._id || i} className="relative pl-8">
                      <div className="absolute left-2 top-1 w-2.5 h-2.5 rounded-full bg-primary/20 border-2 border-primary/40" />
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0.5">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            {ACTION_LABELS[log.action] || log.action}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            By {log.performedBy?.name || 'Unknown'}
                          </p>
                          {log.fromStatus && log.toStatus && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {CUSTODY_LABELS[log.fromStatus] || log.fromStatus}
                              {' → '}
                              {CUSTODY_LABELS[log.toStatus] || log.toStatus}
                            </p>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 shrink-0">{fmtDateTime(log.timestamp)}</p>
                      </div>
                      {log.notes && (
                        <p className="mt-1 text-xs text-gray-600">{log.notes}</p>
                      )}
                      {(log.sponsorName || log.sponsorNumber || log.assignedStaff) && (
                        <div className="mt-1.5 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2 space-y-0.5">
                          {log.sponsorName   && <p><span className="text-gray-400">Sponsor:</span> {log.sponsorName}</p>}
                          {log.sponsorNumber && <p><span className="text-gray-400">Contact:</span> {log.sponsorNumber}</p>}
                          {log.assignedStaff && <p><span className="text-gray-400">Staff:</span> {log.assignedStaff}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PanelCard>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <SharedDocumentsPanel entityType="passport" entityId={id} />
        </div>
      </div>

      {/* Modals */}
      <StatusChangeModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        passportId={id}
        passport={passport}
        currentStatus={passport.custodyStatus}
        onSuccess={loadPassport}
      />

      {passport && (
        <EditPassportModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadPassport}
          passport={passport}
        />
      )}
    </div>
  );
};

export default PassportDetail;
