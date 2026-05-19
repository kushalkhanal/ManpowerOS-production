import { memo } from "react";
import {
  Check, X, ChevronDown,
  UserPlus, Briefcase, Wrench, FolderOpen, Stethoscope,
  Mail, ShieldCheck, GraduationCap, BadgeCheck, Stamp,
  Tag, Globe, FileCheck, PlaneTakeoff, MapPin, Clock,
} from "lucide-react";
import { STATUS_LABELS } from "../../domain/workflow";
import StageDetail from "./StageDetail";

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

const STATE_DOT = {
  done: "bg-green-500 border-green-500 text-white",
  active: "bg-blue-600 border-blue-600 text-white",
  blocked: "bg-red-500 border-red-500 text-white",
  upcoming: "bg-white border-gray-300 text-gray-400",
};

const StageRow = memo(({
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
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${chip.cls}`}>
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
});

StageRow.displayName = "StageRow";

export default StageRow;
