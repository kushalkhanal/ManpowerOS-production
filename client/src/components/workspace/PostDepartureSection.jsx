import { useState } from "react";
import { PlaneTakeoff } from "lucide-react";
import { candidatesApi } from "../../api";
import { showToast } from "../ToastProvider";
import { STATUS_LABELS } from "../../domain/workflow";
import { ConfirmDialog } from "../ui";
import { InfoRow, fmtDate } from "./workspaceHelpers";

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
            <PlaneTakeoff size={14} className="text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-800">
              Departed
              {candidate.departedAt ? ` on ${fmtDate(candidate.departedAt)}` : ""}{" "}
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

export default PostDepartureSection;
