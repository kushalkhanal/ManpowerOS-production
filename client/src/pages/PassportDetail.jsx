import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { usePassports } from '../hooks/usePassports';
import { passportApi as passportsApi } from '../api';
import { devError } from '../utils/devLog';
import StatusChangeModal from '../components/StatusChangeModal';
import EditPassportModal from '../components/EditPassportModal';
import EditCandidateSectionModal from '../components/EditCandidateSectionModal';
import SharedDocumentsPanel from '../components/SharedDocumentsPanel';
import { ArrowLeft, Pencil, Settings2, FileText, Loader2 } from 'lucide-react';
import { showToast } from '../components/ToastProvider';
import { fmtDate, fmtDateTime, daysUntil } from '../utils/format';

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

function PanelCard({ title, children, onEdit, editLoading = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
          {onEdit && (
            <button
              onClick={onEdit}
              disabled={editLoading}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={editLoading ? 'Preparing…' : 'Edit'}
            >
              {editLoading
                ? <Loader2 size={12} className="animate-spin" />
                : <Pencil size={12} />}
            </button>
          )}
        </div>
      )}
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
  const [showStatusModal,    setShowStatusModal]    = useState(false);
  const [showEditModal,      setShowEditModal]      = useState(false);
  const [editSection,        setEditSection]        = useState(null);
  const [ensuringCandidate,  setEnsuringCandidate]  = useState(false);
  const [searchParams, setSearchParams]             = useSearchParams();

  const loadPassport = async () => {
    try {
      const data = await getPassportById(id);
      setPassport(data.passport);
      setLogs(data.logs || []);
    } catch (err) {
      devError('Error loading passport:', err);
    }
  };

  // Opens a profile-section edit modal. If this passport has no linked candidate
  // yet (pool passport before allocation), auto-creates a stub first so editing
  // works before the passport is matched to a demand.
  const openSection = useCallback(async (section) => {
    if (passport?.candidateId?._id) {
      setEditSection(section);
      return;
    }
    setEnsuringCandidate(true);
    try {
      const updatedPassport = await passportsApi.ensureCandidate(id);
      setPassport(updatedPassport.data ?? updatedPassport);
      setEditSection(section);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to prepare candidate profile. Please try again.');
    } finally {
      setEnsuringCandidate(false);
    }
  }, [passport, id]);

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
          {passport.candidateId?._id ? (
            <a
              href={`/print/cv/${passport.candidateId._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FileText size={12} /> Generate CV
            </a>
          ) : (
            <button
              disabled={ensuringCandidate}
              onClick={async () => {
                setEnsuringCandidate(true);
                try {
                  const res = await passportsApi.ensureCandidate(id);
                  const updated = res.data ?? res;
                  setPassport(updated);
                  window.open(`/print/cv/${updated.candidateId._id}`, '_blank');
                } catch (err) {
                  devError('Failed to ensure candidate for CV:', err);
                } finally {
                  setEnsuringCandidate(false);
                }
              }}
              title="Generate CV"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              <FileText size={12} /> {ensuringCandidate ? 'Please wait…' : 'Generate CV'}
            </button>
          )}
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

          {/* ── Permanent & Temporary Address ── */}
          <PanelCard title="Address Information" onEdit={() => openSection('address')} editLoading={ensuringCandidate}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0">
              {/* Permanent */}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2 pb-1 border-b border-gray-100">
                  Permanent Address
                </p>
                <dl className="space-y-3">
                  <InfoRow label="Province"     value={passport.candidateId?.permanentProvince    || '—'} />
                  <InfoRow label="District"     value={passport.candidateId?.permanentDistrict    || '—'} />
                  <InfoRow label="Municipality" value={passport.candidateId?.permanentMunicipality || '—'} />
                  <InfoRow label="Ward No."     value={passport.candidateId?.permanentWardNo      || '—'} />
                </dl>
              </div>
              {/* Temporary */}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2 pb-1 border-b border-gray-100">
                  Temporary Address
                </p>
                <dl className="space-y-3">
                  <InfoRow label="Province"     value={passport.candidateId?.temporaryProvince    || '—'} />
                  <InfoRow label="District"     value={passport.candidateId?.temporaryDistrict    || '—'} />
                  <InfoRow label="Municipality" value={passport.candidateId?.temporaryMunicipality || '—'} />
                  <InfoRow label="Address"      value={passport.candidateId?.temporaryAddress     || '—'} />
                </dl>
              </div>
            </div>
          </PanelCard>

          {/* ── Bank Info ── */}
          <PanelCard title="Bank Account Info" onEdit={() => openSection('bank')} editLoading={ensuringCandidate}>
            {(() => {
              const b = passport.candidateId?.bankInfo;
              return (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <InfoRow label="Bank Name"          value={b?.bankName          || '—'} />
                  <InfoRow label="Account No."        value={b?.accountNo         || '—'} />
                  <InfoRow label="Account Holder"     value={b?.accountHolderName || '—'} />
                  <InfoRow label="Relation"           value={b?.relation          || '—'} />
                </dl>
              );
            })()}
          </PanelCard>

          {/* ── Training Information ── */}
          <PanelCard title="Training Information" onEdit={() => openSection('training')} editLoading={ensuringCandidate}>
            {(() => {
              const list = passport.candidateId?.training;
              if (!list?.length) return (
                <p className="text-xs text-gray-400">No Records Found!</p>
              );
              return (
                <div className="space-y-3">
                  {list.map((t, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 bg-gray-50/40">
                      <InfoRow label="Training" value={t.name      || '—'} />
                      <InfoRow label="Institute" value={t.institute || '—'} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </PanelCard>

          {/* ── Academic Information ── */}
          <PanelCard title="Academic Information" onEdit={() => openSection('academic')} editLoading={ensuringCandidate}>
            {(() => {
              const list = passport.candidateId?.academic;
              if (!list?.length) return (
                <p className="text-xs text-gray-400">No Records Found!</p>
              );
              return (
                <div className="space-y-3">
                  {list.map((a, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 bg-gray-50/40">
                      <InfoRow label="Qualification"    value={a.qualification      || '—'} />
                      <InfoRow label="Institution"      value={a.institutionName    || '—'} />
                      <InfoRow label="Address" value={a.institutionAddress || '—'} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </PanelCard>

          {/* ── Nominee Information ── */}
          <PanelCard title="Nominee Information" onEdit={() => openSection('nominee')} editLoading={ensuringCandidate}>
            {(() => {
              const n = passport.candidateId?.nomineeInfo;
              return (
                <div className="space-y-4">
                  {/* Family */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2 pb-1 border-b border-gray-100">
                      Basic Family Info
                    </p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Father Name" value={n?.fatherName  || '—'} />
                      <InfoRow label="Mother Name" value={n?.motherName  || '—'} />
                      <InfoRow label="Spouse Name" value={n?.spouseName  || '—'} />
                      <InfoRow label="No. of Children" value={n?.noOfChildren ?? '—'} />
                      <InfoRow label="Spouse Age"  value={n?.spouseAge   ?? '—'} />
                    </dl>
                  </div>
                  {/* Emergency Contact */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2 pb-1 border-b border-gray-100">
                      Emergency Contact
                    </p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Contact Person"  value={n?.emergencyContactPerson  || '—'} />
                      <InfoRow label="Contact Number"  value={n?.emergencyContactNumber  || '—'} />
                      <InfoRow label="Contact Address" value={n?.emergencyContactAddress || '—'} />
                    </dl>
                  </div>
                  {/* Nominee */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2 pb-1 border-b border-gray-100">
                      Nominee
                    </p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Name"     value={n?.nomineeName     || '—'} />
                      <InfoRow label="Relation" value={n?.nomineeRelation || '—'} />
                      <InfoRow label="Address"  value={n?.nomineeAddress  || '—'} />
                    </dl>
                  </div>
                </div>
              );
            })()}
          </PanelCard>

          {/* ── Work Detail Information ── */}
          <PanelCard title="Work Detail Information" onEdit={() => openSection('workDetail')} editLoading={ensuringCandidate}>
            {(() => {
              const c    = passport.candidateId;
              const dem  = passport.allocatedToDemandId;
              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2 pb-1 border-b border-gray-100">
                      Worker Info
                    </p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Name"             value={passport.fullName           || '—'} />
                      <InfoRow label="Passport No."     value={passport.passportNumber     || '—'} mono />
                      <InfoRow label="Visa No."         value={c?.visaNumber               || '—'} mono />
                      <InfoRow label="Visa Issued Date" value={fmtDate(c?.visaIssuedDate || c?.visaReceivedDate)} />
                      <InfoRow label="Visa Expiry Date" value={fmtDate(c?.visaExpiryDate)} />
                    </dl>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2 pb-1 border-b border-gray-100">
                      Company Info
                    </p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Country"      value={dem?.employerCountry      || c?.desiredCountry    || '—'} />
                      <InfoRow label="Company"      value={dem?.employerCompanyName  || '—'} />
                      <InfoRow label="Skill"        value={dem?.jobCategory          || c?.desiredJobCategory || '—'} />
                      <InfoRow label="KDN / BPA No." value={c?.kdnBpaNo             || '—'} mono />
                    </dl>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2 pb-1 border-b border-gray-100">
                      Branch Info
                    </p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Branch" value={c?.branchInfo || '—'} />
                    </dl>
                  </div>
                </div>
              );
            })()}
          </PanelCard>

          {/* ── Physical Attributes (from linked candidate) ── */}
          <PanelCard
            title="Physical Attributes"
            onEdit={() => openSection('physical')}
            editLoading={ensuringCandidate}
          >
            {(() => {
              const pa = passport.candidateId?.physicalAttributes || {};
              return (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <InfoRow label="Height"      value={pa.height     || '—'} />
                  <InfoRow label="Weight"      value={pa.weight     || '—'} />
                  <InfoRow label="Blood Group" value={pa.bloodGroup || '—'} />
                  <InfoRow label="Eye Color"   value={pa.eyeColor   || '—'} />
                  <InfoRow label="Complexion"  value={pa.complexion || '—'} />
                </dl>
              );
            })()}
          </PanelCard>

          {/* ── Work Experience (from linked candidate) ── */}
          <PanelCard
            title="Work Experience"
            onEdit={() => openSection('workHistory')}
            editLoading={ensuringCandidate}
          >
            {(() => {
              const list = passport.candidateId?.workHistory || [];
              const fmtMonthYear = (d) => {
                if (!d) return null;
                try {
                  return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
                } catch { return null; }
              };

              if (!list.length) {
                // Empty state: still show the field labels with em-dash, same look as other sections
                return (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <InfoRow label="Position" value="—" />
                    <InfoRow label="Company"  value="—" />
                    <InfoRow label="Country"  value="—" />
                    <InfoRow label="Duration" value="—" />
                  </dl>
                );
              }

              return (
                <div className="space-y-4">
                  {list.map((w, i) => (
                    <div key={i}>
                      {i > 0 && (
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold pb-1 border-b border-gray-100 mb-2 mt-1">
                          Experience {i + 1}
                        </p>
                      )}
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <InfoRow label="Position" value={w.position || '—'} />
                        <InfoRow label="Company"  value={w.company  || '—'} />
                        <InfoRow label="Country"  value={w.country  || '—'} />
                        <InfoRow
                          label="Duration"
                          value={
                            (fmtMonthYear(w.fromDate) || '—') +
                            ' – ' +
                            (w.isCurrent ? 'Present' : (fmtMonthYear(w.toDate) || '—'))
                          }
                        />
                      </dl>
                    </div>
                  ))}
                </div>
              );
            })()}
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

      <EditCandidateSectionModal
        isOpen={!!editSection}
        section={editSection}
        candidate={passport.candidateId}
        onClose={() => setEditSection(null)}
        onSuccess={loadPassport}
      />
    </div>
  );
};

export default PassportDetail;
