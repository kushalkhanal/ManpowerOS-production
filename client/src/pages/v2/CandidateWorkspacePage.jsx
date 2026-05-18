import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  UserPlus,
  Briefcase,
  Wrench,
  FolderOpen,
  Stethoscope,
  Mail,
  ShieldCheck,
  GraduationCap,
  BadgeCheck,
  Stamp,
  Tag,
  Globe,
  FileCheck,
  PlaneTakeoff,
  MapPin,
  Printer,
  Activity,
  ArrowLeft,
  ExternalLink,
  FileText,
  Clock,
  Trash2,
} from "lucide-react";
import { candidatesApi, feeApi, taskApi } from "../../api";
import {
  listPipelineStages,
  STAGE_FOR_STATUS,
  STAGE_ORDER,
  BLOCKING_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  getCountryFlag,
  getRegionForCountry,
  REGION,
  STAGE,
} from "../../domain/workflow";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../components/ToastProvider";
import ComplianceRecordsCard from "../../components/ComplianceRecordsCard";
import TradeTestCard from "../../components/TradeTestCard";
import DocumentVault from "../../components/DocumentVault";
import MedicalModal from "../../components/MedicalModal";
import InsuranceModal from "../../components/InsuranceModal";
import CallingVisaModal from "../../components/CallingVisaModal";
import OrientationModal from "../../components/OrientationModal";
import VisaModal from "../../components/VisaModal";
import FeimsModal from "../../components/FeimsModal";
import DepartureModal from "../../components/DepartureModal";
import PassportCollectionModal from "../../components/PassportCollectionModal";
import SecureLink from "../../components/SecureLink";
import FeeModal from "../../components/FeeModal";
import ActivityLogModal from "../../components/ActivityLogModal";
import FEIMSSummaryModal from "../../components/FEIMSSummaryModal";
import ContractsPanel from "../../components/ContractsPanel";
import DepartureGatePanel, {
  evaluateGate,
} from "../../components/DepartureGatePanel";
import { ConfirmDialog } from "../../components/ui";

// ─── Stage icon map ───────────────────────────────────────────────────────────

const STAGE_ICONS = {
  registration: UserPlus,
  demand_matching: Briefcase,
  trade_test: Wrench,
  documentation: FolderOpen,
  medical: Stethoscope,
  calling_visa: Mail,
  compliance: ShieldCheck,
  orientation: GraduationCap,
  purba_swukriti: BadgeCheck,
  visa_stamping: Stamp,
  plks: Tag,
  feims_submission: Globe,
  shram_swukriti: FileCheck,
  departure_prep: PlaneTakeoff,
  post_departure: MapPin,
};

// ─── Kanban column → domain stage mapping ────────────────────────────────────

const STAGE_TO_COL = {
  documentation: "passport_collection",
  medical: "medical",
  calling_visa: "calling_visa",
  compliance: "insurance",
  visa_stamping: "visa",
  departure_prep: "flight",
  feims_submission: "dofe",
  orientation: "dofe",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-baseline justify-between py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-[11px] uppercase tracking-wide text-gray-400 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-800 font-medium text-right ml-4">
      {value || "—"}
    </span>
  </div>
);

const FileLink = ({ url, label }) =>
  url ? (
    <SecureLink
      storedUrl={url}
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
    >
      <FileText size={11} /> {label} <ExternalLink size={9} />
    </SecureLink>
  ) : null;

const EditBtn = ({ onClick, children = "Edit" }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
  >
    {children}
  </button>
);

const CollapsibleSection = ({
  title,
  badge,
  badgeColor,
  expanded,
  onToggle,
  children,
}) => (
  <div className="mt-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {badge != null && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeColor || "bg-gray-100 text-gray-500"}`}
          >
            {badge}
          </span>
        )}
      </div>
      {expanded ? (
        <ChevronDown size={14} className="text-gray-400" />
      ) : (
        <ChevronRight size={14} className="text-gray-400" />
      )}
    </button>
    {expanded && (
      <div className="px-4 pb-4 border-t border-gray-50">{children}</div>
    )}
  </div>
);

// ─── Post-Departure finalize section ──────────────────────────────────────────

const PostDepartureSection = ({ candidate, candidateId, onReload }) => {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const departed = candidate.status === "departed" || !!candidate.departedAt;

  const handleFinalize = async () => {
    setSaving(true);
    try {
      await candidatesApi.markColumnComplete(candidateId, "departure");
      showToast.success("Candidate marked as Departed");
      setConfirming(false);
      onReload?.();
    } catch (err) {
      showToast.error(
        err.response?.data?.message || "Failed to mark as departed",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <InfoRow
        label="Departed"
        value={fmtDate(candidate.departedAt || candidate.actualDepartureDate)}
      />
      <InfoRow
        label="Status"
        value={STATUS_LABELS[candidate.status] || candidate.status}
      />
      <InfoRow
        label="Destination"
        value={candidate.demandCountry || candidate.desiredCountry}
      />

      <div className="mt-4">
        {departed ? (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <PlaneTakeoff
              size={14}
              className="text-emerald-600 flex-shrink-0"
            />
            <p className="text-xs font-semibold text-emerald-800">
              Departed
              {candidate.departedAt
                ? ` on ${fmtDate(candidate.departedAt)}`
                : ""}{" "}
              — case closed.
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={() => setConfirming(true)}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-60 transition-colors"
            >
              <PlaneTakeoff size={14} />
              Mark as Departed (finalize)
            </button>
            <p className="mt-1.5 text-[11px] text-gray-400 text-center italic">
              Final step — moves this candidate to the Departed list. Use only
              once they have actually left.
            </p>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirming}
        title="Mark as Departed?"
        message={`This will finalize ${candidate.fullName || "the candidate"} as Departed and move them to the Departed records. This action is the final seal — proceed only if they have actually left.`}
        confirmLabel={saving ? "Marking…" : "Yes, mark Departed"}
        cancelLabel="Cancel"
        onConfirm={handleFinalize}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
};

// ─── Per-stage expanded detail ────────────────────────────────────────────────

const StageDetail = ({
  stageId,
  kanbanData,
  onEdit,
  candidateId,
  onReload,
}) => {
  const { candidate, passport, demand, columns } = kanbanData;
  const col = (id) => columns?.find((c) => c.id === id);
  const dofeData = col("dofe")?.data;

  switch (stageId) {
    case STAGE.REGISTRATION:
      return (
        <div>
          <InfoRow
            label="Registered"
            value={candidate.registeredAtBS || fmtDate(candidate.registeredAt)}
          />
          <InfoRow label="Phone" value={candidate.phone} />
          <InfoRow label="Citizenship" value={candidate.nationalIdNumber} />
          <InfoRow label="District" value={candidate.permanentDistrict} />
          <InfoRow label="Ward" value={candidate.permanentWardNo} />
          <InfoRow label="Agent" value={candidate.agentName} />
        </div>
      );

    case STAGE.DEMAND_MATCHING:
      return demand ? (
        <div>
          <InfoRow label="Employer" value={demand.employerCompanyName} />
          <InfoRow label="Country" value={demand.employerCountry} />
          <InfoRow label="Job" value={candidate.demandJobCategory} />
          <InfoRow label="Demand No." value={demand.demandLetterNumber} />
          <div className="mt-3">
            <Link
              to={`/demands/${demand._id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              Open demand <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="py-2">
          <p className="text-sm text-gray-500">No demand allocated yet.</p>
          <Link
            to="/demands"
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            Browse demands →
          </Link>
        </div>
      );

    case STAGE.TRADE_TEST:
      return (
        <div className="pt-1">
          <TradeTestCard candidateId={candidateId} />
        </div>
      );

    case STAGE.DOCUMENTATION: {
      return (
        <div>
          <InfoRow
            label="Passport No."
            value={passport?.passportNumber || candidate.passportNumber}
          />
          <InfoRow label="Expiry (BS)" value={passport?.expiryDateBS} />
          <InfoRow label="Issued district" value={passport?.issuedDistrict} />
          <InfoRow
            label="Collected"
            value={passport?.collectedAtBS || fmtDate(passport?.collectedAt)}
          />
          {passport?.scannedImageUrl && (
            <div className="mt-2">
              <FileLink url={passport.scannedImageUrl} label="Passport scan" />
            </div>
          )}
          <div className="mt-3">
            <EditBtn onClick={() => onEdit("passport_collection")}>
              {passport ? "Edit passport" : "Collect passport"}
            </EditBtn>
          </div>
        </div>
      );
    }

    case STAGE.MEDICAL: {
      const m = col("medical")?.data;
      return (
        <div>
          <InfoRow label="Result" value={m?.result?.toUpperCase()} />
          <InfoRow label="Conducted" value={fmtDate(m?.conductedDate)} />
          <InfoRow label="Expires" value={fmtDate(m?.reportExpiryDate)} />
          <InfoRow label="Center" value={m?.examCenter} />
          {m?.reportFileUrl && (
            <div className="mt-2">
              <FileLink url={m.reportFileUrl} label="Medical report" />
            </div>
          )}
          <div className="mt-3">
            <EditBtn onClick={() => onEdit("medical")}>
              {m ? "Update medical" : "Record medical"}
            </EditBtn>
          </div>
        </div>
      );
    }

    case STAGE.CALLING_VISA:
      return (
        <div>
          <InfoRow label="Letter No." value={candidate.callingLetterNumber} />
          <InfoRow
            label="Received"
            value={fmtDate(candidate.callingLetterReceivedDate)}
          />
          <InfoRow
            label="Expires"
            value={fmtDate(candidate.callingLetterExpiryDate)}
          />
          <div className="mt-3">
            <EditBtn onClick={() => onEdit("calling_visa")}>
              {candidate.callingLetterNumber
                ? "Update calling visa"
                : "Record calling visa"}
            </EditBtn>
          </div>
        </div>
      );

    case STAGE.COMPLIANCE: {
      const ins = col("insurance")?.data;
      return (
        <div>
          <InfoRow
            label="Insurance policy"
            value={ins?.insurancePolicyNumber}
          />
          <InfoRow label="SSF receipt" value={ins?.ssfReceiptNumber} />
          <InfoRow
            label="Welfare fund"
            value={
              ins?.welfareFundPaid
                ? "Paid"
                : ins?.welfareFundPaid === false
                  ? "Not paid"
                  : "—"
            }
          />
          <InfoRow
            label="Welfare receipt"
            value={ins?.welfareFundReceiptNumber}
          />
          {ins?.insurancePaidReceiptUrl && (
            <div className="mt-2">
              <FileLink
                url={ins.insurancePaidReceiptUrl}
                label="Insurance receipt"
              />
            </div>
          )}
          <div className="mt-3">
            <EditBtn onClick={() => onEdit("insurance")}>
              Update compliance
            </EditBtn>
          </div>
        </div>
      );
    }

    case STAGE.ORIENTATION: {
      const ori = dofeData?.orientation;
      return (
        <div>
          <InfoRow label="Certificate No." value={ori?.certificateNumber} />
          <InfoRow label="Date" value={fmtDate(ori?.startDate)} />
          <InfoRow label="Status" value={ori?.completionStatus} />
          {ori?.certificateFileUrl && (
            <div className="mt-2">
              <FileLink url={ori.certificateFileUrl} label="Certificate" />
            </div>
          )}
          <div className="mt-3">
            <EditBtn onClick={() => onEdit("dofe_orientation")}>
              Update orientation
            </EditBtn>
          </div>
        </div>
      );
    }

    case STAGE.VISA_STAMPING:
      return (
        <div>
          <InfoRow label="Visa No." value={candidate.visaNumber} />
          <InfoRow label="Stamped" value={fmtDate(candidate.visaStampedDate)} />
          <InfoRow label="Expiry" value={fmtDate(candidate.visaExpiryDate)} />
          {candidate.visaFileUrl && (
            <div className="mt-2">
              <FileLink url={candidate.visaFileUrl} label="Visa copy" />
            </div>
          )}
          <div className="mt-3">
            <EditBtn onClick={() => onEdit("visa")}>Update visa</EditBtn>
          </div>
        </div>
      );

    case STAGE.DEPARTURE_PREP: {
      const flight = col("flight")?.data;
      return (
        <div>
          <InfoRow
            label="Flight date"
            value={fmtDate(candidate.flightDate) || fmtDate(flight?.flightDate)}
          />
          <InfoRow
            label="Flight No."
            value={candidate.flightNumber || flight?.flightNumber}
          />
          <InfoRow label="Airport slot" value={candidate.airportSlotTime} />
          <div className="mt-3">
            <EditBtn onClick={() => onEdit("flight")}>Update flight</EditBtn>
          </div>
        </div>
      );
    }

    case STAGE.POST_DEPARTURE:
      return (
        <PostDepartureSection
          candidate={candidate}
          candidateId={candidateId}
          onReload={onReload}
        />
      );

    default:
      return (
        <p className="py-2 text-sm text-gray-400 italic">
          No detail available.
        </p>
      );
  }
};

// ─── Stage row ────────────────────────────────────────────────────────────────

const STATE_DOT = {
  done: "bg-green-500 border-green-500 text-white",
  active: "bg-blue-600 border-blue-600 text-white",
  blocked: "bg-red-500 border-red-500 text-white",
  upcoming: "bg-white border-gray-300 text-gray-400",
};

const StageRow = ({
  stage,
  state,
  isExpanded,
  onToggle,
  kanbanData,
  onOpenModal,
  candidateId,
  onReload,
}) => {
  const Icon = STAGE_ICONS[stage.id] || Clock;
  const { candidate } = kanbanData;

  const chip = (() => {
    if (state === "done")
      return { label: "Complete", cls: "bg-green-100 text-green-700" };
    if (state === "blocked")
      return {
        label: STATUS_LABELS[candidate.status] || "Blocked",
        cls: "bg-red-100 text-red-700",
      };
    if (state === "active")
      return {
        label: STATUS_LABELS[candidate.status] || "In Progress",
        cls: "bg-blue-100 text-blue-700",
      };
    return { label: "Pending", cls: "bg-gray-100 text-gray-400" };
  })();

  return (
    <div
      className={`relative ${state === "active" ? "before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-blue-500" : ""}`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
          state === "active"
            ? "bg-blue-50/60 hover:bg-blue-50"
            : "hover:bg-gray-50"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${STATE_DOT[state]}`}
        >
          {state === "done" ? (
            <Check size={13} strokeWidth={3} />
          ) : state === "blocked" ? (
            <X size={13} strokeWidth={3} />
          ) : (
            <Icon size={13} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-sm font-medium ${state === "upcoming" ? "text-gray-500" : "text-gray-800"}`}
            >
              {stage.label}
            </span>
            {stage.optional && (
              <span className="text-[9px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                optional
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${chip.cls}`}
          >
            {chip.label}
          </span>
          <ChevronDown
            size={13}
            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
          />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 pb-4 bg-gray-50/70 border-t border-gray-100">
          <div className="mt-3">
            <StageDetail
              stageId={stage.id}
              kanbanData={kanbanData}
              onEdit={onOpenModal}
              candidateId={candidateId}
              onReload={onReload}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main workspace page ──────────────────────────────────────────────────────

const CandidateWorkspacePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [kanbanData, setKanbanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedStages, setExpandedStages] = useState(new Set());
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showFEIMSSummary, setShowFEIMSSummary] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feeHistory, setFeeHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expandedPanels, setExpandedPanels] = useState({});

  useEffect(() => {
    loadKanban();
  }, [id]);

  // Close any open modal/panel on Escape — priority order: modal > panels > menus
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (activeModal) {
        setActiveModal(null);
        setModalData(null);
        return;
      }
      if (showActivityLog) {
        setShowActivityLog(false);
        return;
      }
      if (showFEIMSSummary) {
        setShowFEIMSSummary(false);
        return;
      }
      if (showPrintMenu) {
        setShowPrintMenu(false);
        return;
      }
      if (showUnassignConfirm) {
        setShowUnassignConfirm(false);
        return;
      }
      if (showDeleteConfirm) {
        setShowDeleteConfirm(false);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    activeModal,
    showActivityLog,
    showFEIMSSummary,
    showPrintMenu,
    showUnassignConfirm,
    showDeleteConfirm,
  ]);

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const isModalOpen = !!(
      activeModal ||
      showActivityLog ||
      showFEIMSSummary ||
      showDeleteConfirm ||
      showUnassignConfirm
    );
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    activeModal,
    showActivityLog,
    showFEIMSSummary,
    showDeleteConfirm,
    showUnassignConfirm,
  ]);

  const loadKanban = async () => {
    try {
      setLoading(true);
      const res = await candidatesApi.getKanban(id);
      setKanbanData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load candidate");
    } finally {
      setLoading(false);
    }
  };

  const toggleStage = (stageId) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      next.has(stageId) ? next.delete(stageId) : next.add(stageId);
      return next;
    });
  };

  const openModal = (modalId) => {
    const col = (kanbanData?.columns || []).find((c) => c.id === modalId);
    setModalData(col?.data || null);
    setActiveModal(modalId);
  };

  const handleModalClose = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const handleModalSuccess = () => {
    loadKanban();
    setActiveModal(null);
    setModalData(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await candidatesApi.delete(id);
      showToast.success("Candidate deleted.");
      navigate("/candidates", { replace: true });
    } catch (err) {
      showToast.error(
        err.response?.data?.message || "Failed to delete candidate.",
      );
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const togglePanel = async (panel) => {
    const willOpen = !expandedPanels[panel];
    setExpandedPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
    if (willOpen) {
      if (panel === "fees") {
        try {
          const res = await feeApi.getAll({ candidateId: id });
          setFeeHistory(res.data.data || []);
        } catch {}
      } else if (panel === "tasks") {
        try {
          const res = await taskApi.getByCandidate(id);
          setTasks(res.data || []);
        } catch {}
      }
    }
  };

  const handleUnassign = async () => {
    setUnassigning(true);
    try {
      await candidatesApi.unassignFromDemand(id);
      showToast.success("Unassigned from demand");
      setShowUnassignConfirm(false);
      loadKanban();
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to unassign");
    } finally {
      setUnassigning(false);
    }
  };

  const renderModal = () => {
    if (!activeModal) return null;
    switch (activeModal) {
      case "passport_collection":
        return (
          <PassportCollectionModal
            isOpen
            onClose={handleModalClose}
            passport={kanbanData?.passport}
            candidateId={id}
            onSuccess={handleModalSuccess}
          />
        );
      case "medical":
        return (
          <MedicalModal
            isOpen
            onClose={handleModalClose}
            medical={modalData}
            candidateId={id}
            onSuccess={handleModalSuccess}
          />
        );
      case "insurance":
        return (
          <InsuranceModal
            isOpen
            onClose={handleModalClose}
            candidateId={id}
            candidateData={modalData}
            onSuccess={handleModalSuccess}
          />
        );
      case "calling_visa":
        return (
          <CallingVisaModal
            isOpen
            onClose={handleModalClose}
            candidateId={id}
            candidateData={kanbanData?.candidate}
            demand={kanbanData?.demand}
            onSuccess={handleModalSuccess}
          />
        );
      case "visa":
        return (
          <VisaModal
            isOpen
            onClose={handleModalClose}
            candidateId={id}
            candidateData={modalData}
            onSuccess={handleModalSuccess}
          />
        );
      case "fee":
        return (
          <FeeModal
            isOpen
            onClose={handleModalClose}
            candidateId={id}
            onSuccess={handleModalSuccess}
          />
        );
      case "flight":
        return (
          <DepartureModal
            isOpen
            onClose={handleModalClose}
            candidateId={id}
            candidateData={kanbanData?.candidate}
            title="Flight Booking"
            onSuccess={handleModalSuccess}
          />
        );
      case "dofe":
        return (
          <FeimsModal
            isOpen
            onClose={handleModalClose}
            candidateId={id}
            candidateData={kanbanData?.candidate}
            onSuccess={handleModalSuccess}
          />
        );
      case "dofe_orientation":
        return (
          <OrientationModal
            isOpen
            onClose={handleModalClose}
            candidateId={id}
            orientation={
              kanbanData?.columns?.find((c) => c.id === "dofe")?.data
                ?.orientation || null
            }
            onSuccess={handleModalSuccess}
          />
        );
      default:
        return null;
    }
  };

  // ── Loading / error states ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm">{error}</p>
          <Link
            to="/candidates"
            className="mt-2 inline-block text-sm text-red-600 hover:underline"
          >
            ← Back to candidates
          </Link>
        </div>
      </div>
    );
  }

  if (!kanbanData) return null;

  // ── Derived data ──

  const { candidate, passport, demand, columns, overallProgress } = kanbanData;
  const country = candidate.demandCountry || candidate.desiredCountry;
  const region = getRegionForCountry(country);
  const pipelineStages = listPipelineStages(country);
  const currentStageId = STAGE_FOR_STATUS[candidate.status];
  const currentStageOrder = STAGE_ORDER[currentStageId] ?? 0;
  const isBlocked = BLOCKING_STATUSES.has(candidate.status);

  const getStageState = (stage) => {
    const colId = STAGE_TO_COL[stage.id];
    const col = colId ? columns?.find((c) => c.id === colId) : null;
    if (col?.status === "complete") return "done";
    if (col?.status === "blocked") return "blocked";
    const order = STAGE_ORDER[stage.id] ?? 99;
    if (order === currentStageOrder) return isBlocked ? "blocked" : "active";
    if (order < currentStageOrder) return "done";
    return "upcoming";
  };

  const progressColor =
    overallProgress.percent < 40
      ? "bg-red-500"
      : overallProgress.percent < 70
        ? "bg-amber-500"
        : "bg-green-500";

  const gateScore = evaluateGate(kanbanData);

  // ── Render ──

  return (
    // Break out of Layout's max-w-7xl padding to allow full-bleed sticky header
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
      {/* ─── Sticky header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <Link
              to="/candidates"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={17} />
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-gray-900 leading-tight truncate">
                  {candidate.fullName}
                </h1>
                {country && (
                  <span className="text-base leading-none" title={country}>
                    {getCountryFlag(country)}
                  </span>
                )}
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[candidate.status] || "bg-gray-100 text-gray-600"}`}
                >
                  {STATUS_LABELS[candidate.status] || candidate.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              {/* Print dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPrintMenu((p) => !p)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Print documents"
                >
                  <Printer size={15} />
                </button>
                {showPrintMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowPrintMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-xl shadow-xl w-52 py-1 text-sm">
                      <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                        Print Documents
                      </p>
                      <a
                        href={`/print/biodata/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowPrintMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <FileText size={14} className="text-blue-500" />
                        <span>Candidate Bio-Data</span>
                      </a>
                      <a
                        href={`/print/feims-packet/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowPrintMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <Globe size={14} className="text-indigo-500" />
                        <span>FEIMS Packet</span>
                      </a>
                      <a
                        href={`/print/departure/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowPrintMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <PlaneTakeoff size={14} className="text-emerald-500" />
                        <span>Departure Clearance</span>
                      </a>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowFEIMSSummary(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="FEIMS readiness review"
              >
                <Globe size={15} />
              </button>
              <button
                onClick={() => setShowActivityLog(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Activity log"
              >
                <Activity size={15} />
              </button>
              {(user?.role === "admin" || user?.role === "superadmin") && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete candidate"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2 max-w-3xl mx-auto">
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${overallProgress.percent}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400 tabular-nums w-8 text-right">
              {overallProgress.percent}%
            </span>
          </div>
        </div>
      </div>

      {/* ─── Page body ─────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16 pt-4">
        <div className="max-w-3xl mx-auto">
          {/* Next action / blocked banner — with Document Vault tab on the right */}
          <div
            className={`mb-3 px-4 py-3 rounded-xl flex items-center justify-between gap-3 ${
              overallProgress.blockedBy
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {overallProgress.blockedBy || overallProgress.nextAction ? (
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <AlertCircle
                  size={15}
                  className={`mt-0.5 flex-shrink-0 ${
                    overallProgress.blockedBy ? "text-red-500" : "text-blue-500"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {overallProgress.blockedBy ? "Blocked" : "Next action"}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {overallProgress.blockedBy || overallProgress.nextAction}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Document Vault tab */}
            <button
              onClick={() =>
                setExpandedPanels((p) => ({ ...p, vault: !p.vault }))
              }
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                expandedPanels.vault
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <FolderOpen size={13} />
              Document Vault
            </button>
          </div>

          {/* Document Vault — inline panel under the banner */}
          {expandedPanels.vault && (
            <div className="mb-3 bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen size={14} className="text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    Document Vault
                  </span>
                </div>
                <button
                  onClick={() =>
                    setExpandedPanels((p) => ({ ...p, vault: false }))
                  }
                  className="text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="px-4 pb-4">
                <DocumentVault
                  candidateId={id}
                  kanbanData={kanbanData}
                  onUploaded={loadKanban}
                />
              </div>
            </div>
          )}

          {/* Info chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[
              { label: "Phone", value: candidate.phone, copyable: true },
              {
                label: "Passport",
                value: passport?.passportNumber || candidate.passportNumber,
                copyable: true,
              },
              {
                label: "Gender",
                value: candidate.gender
                  ? candidate.gender.charAt(0).toUpperCase() +
                    candidate.gender.slice(1)
                  : null,
              },
              {
                label: "District",
                value: candidate.permanentDistrict || candidate.address,
              },
            ].map(({ label, value, copyable }) => (
              <div
                key={label}
                onClick={
                  copyable && value
                    ? () => {
                        navigator.clipboard.writeText(value);
                        showToast.success(`${label} copied`);
                      }
                    : undefined
                }
                className={`bg-white rounded-xl border border-gray-100 px-3 py-2.5 ${copyable && value ? "cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all" : ""}`}
                title={
                  copyable && value
                    ? `Click to copy ${label.toLowerCase()}`
                    : undefined
                }
              >
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  {label}
                </p>
                <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Demand bar */}
          {demand && (
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mb-3 flex items-center justify-between gap-3">
              <div className="text-sm min-w-0">
                <span className="text-gray-500">Demand: </span>
                <span className="font-semibold text-gray-800">
                  {demand.employerCompanyName}
                </span>
                <span className="text-gray-300 mx-2">·</span>
                <span className="text-gray-500">{demand.employerCountry}</span>
                {demand.demandLetterNumber && (
                  <>
                    <span className="text-gray-300 mx-2">·</span>
                    <span className="text-gray-400 text-xs">
                      {demand.demandLetterNumber}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  to={`/demands/${demand._id}`}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Open →
                </Link>
                {user?.role !== "agent" && (
                  <button
                    onClick={() => setShowUnassignConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Unassign
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ─── Pipeline timeline ──────────────────────────────────────── */}
          <div className="mb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-0.5">
              {region === REGION.MALAYSIA
                ? "🇲🇾 Malaysia Pipeline"
                : "⚓ Gulf Pipeline"}
              <span className="ml-2 font-normal text-gray-300 normal-case tracking-normal">
                {overallProgress.complete} of {overallProgress.total} stages
                done
              </span>
            </p>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {pipelineStages.map((stage) => (
                <StageRow
                  key={stage.id}
                  stage={stage}
                  state={getStageState(stage)}
                  isExpanded={expandedStages.has(stage.id)}
                  onToggle={() => toggleStage(stage.id)}
                  kanbanData={kanbanData}
                  onOpenModal={openModal}
                  candidateId={id}
                  onReload={loadKanban}
                />
              ))}
            </div>
          </div>

          {/* ─── Collapsible bottom sections ───────────────────────────── */}
          <CollapsibleSection
            title="Departure Gate"
            badge={
              gateScore.ready ? "✓ Ready" : `${gateScore.failCount} blocking`
            }
            badgeColor={
              gateScore.ready
                ? "bg-emerald-100 text-emerald-700"
                : gateScore.failCount <= 2
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }
            expanded={expandedPanels.gate}
            onToggle={() => setExpandedPanels((p) => ({ ...p, gate: !p.gate }))}
          >
            <DepartureGatePanel kanbanData={kanbanData} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Passport details"
            expanded={expandedPanels.passport}
            onToggle={() =>
              setExpandedPanels((p) => ({ ...p, passport: !p.passport }))
            }
          >
            {passport ? (
              <div className="mt-3">
                <InfoRow label="Passport No." value={passport.passportNumber} />
                <InfoRow label="Full name" value={passport.fullName} />
                <InfoRow label="DOB (BS)" value={passport.dateOfBirthBS} />
                <InfoRow label="Expiry (BS)" value={passport.expiryDateBS} />
                <InfoRow
                  label="Issued district"
                  value={passport.issuedDistrict}
                />

                {/* Collected at + custody status on the same row */}
                <div className="flex items-baseline justify-between py-1.5 border-b border-gray-50">
                  <span className="text-[11px] uppercase tracking-wide text-gray-400 flex-shrink-0">
                    Collected
                  </span>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm text-gray-800 font-medium">
                      {passport.collectedAtBS ||
                        fmtDate(passport.collectedAt) ||
                        "—"}
                    </span>
                    {passport.custodyStatus &&
                      (() => {
                        const STATUS_MAP = {
                          with_agency: {
                            label: "With Agency",
                            cls: "bg-blue-100 text-blue-700",
                          },
                          returned_to_candidate: {
                            label: "Returned",
                            cls: "bg-gray-100 text-gray-600",
                          },
                          submitted_embassy: {
                            label: "At Embassy",
                            cls: "bg-purple-100 text-purple-700",
                          },
                          lost: {
                            label: "Lost",
                            cls: "bg-red-100 text-red-600",
                          },
                        };
                        const s = STATUS_MAP[passport.custodyStatus];
                        return s ? (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.cls}`}
                          >
                            {s.label}
                          </span>
                        ) : null;
                      })()}
                  </div>
                </div>

                {passport.scannedImageUrl && (
                  <div className="mt-2">
                    <FileLink
                      url={passport.scannedImageUrl}
                      label="Passport scan"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">No passport linked.</p>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Government Compliance"
            badge={candidate?.purbaSwukritiDone ? "✓" : undefined}
            badgeColor="bg-sky-100 text-sky-700"
            expanded={expandedPanels.compliance}
            onToggle={() => togglePanel("compliance")}
          >
            <div className="mt-3">
              <ComplianceRecordsCard
                candidate={candidate}
                onUpdated={loadKanban}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Fee history"
            expanded={expandedPanels.fees}
            onToggle={() => togglePanel("fees")}
            badge={feeHistory.length > 0 ? feeHistory.length : undefined}
          >
            {feeHistory.length > 0 ? (
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 text-left">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Amount</th>
                    <th className="pb-2 font-semibold">Method</th>
                    <th className="pb-2 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {feeHistory.map((fee, i) => (
                    <tr key={i}>
                      <td className="py-2 text-gray-600">
                        {fee.paidAtBS || fmtDate(fee.paidAt)}
                      </td>
                      <td className="py-2 font-medium text-gray-800">
                        रू {fee.amountNPR?.toLocaleString()}
                      </td>
                      <td className="py-2 text-gray-500">
                        {fee.paymentMethod || "—"}
                      </td>
                      <td className="py-2 text-gray-500">
                        {fee.transactionType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                No fee transactions yet.
              </p>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Tasks"
            expanded={expandedPanels.tasks}
            onToggle={() => togglePanel("tasks")}
            badge={tasks.length > 0 ? tasks.length : undefined}
          >
            {tasks.length > 0 ? (
              <ul className="mt-3 divide-y divide-gray-50">
                {tasks.map((task) => (
                  <li
                    key={task._id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-gray-700">{task.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {task.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-500">No tasks assigned.</p>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Contracts"
            expanded={expandedPanels.contracts}
            onToggle={() =>
              setExpandedPanels((p) => ({ ...p, contracts: !p.contracts }))
            }
          >
            <ContractsPanel candidateId={id} />
          </CollapsibleSection>
        </div>
      </div>

      {/* ─── Modals ────────────────────────────────────────────────────── */}
      {renderModal()}

      {showActivityLog && (
        <ActivityLogModal
          isOpen
          onClose={() => setShowActivityLog(false)}
          candidateId={id}
        />
      )}

      {showFEIMSSummary && (
        <FEIMSSummaryModal
          isOpen
          onClose={() => setShowFEIMSSummary(false)}
          kanbanData={kanbanData}
        />
      )}

      <ConfirmDialog
        isOpen={showUnassignConfirm}
        title="Unassign from Demand"
        message="This will remove the candidate from the demand. Are you sure?"
        confirmLabel="Unassign"
        confirmVariant="danger"
        loading={unassigning}
        onCancel={() => !unassigning && setShowUnassignConfirm(false)}
        onConfirm={handleUnassign}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Candidate"
        message={`Are you sure you want to permanently delete ${kanbanData?.candidate?.fullName || "this candidate"}? This action cannot be undone.`}
        confirmLabel="Delete Candidate"
        confirmVariant="danger"
        loading={deleting}
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CandidateWorkspacePage;
