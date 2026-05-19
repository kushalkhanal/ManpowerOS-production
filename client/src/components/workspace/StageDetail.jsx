import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { STAGE, STATUS_LABELS } from "../../domain/workflow";
import TradeTestCard from "../TradeTestCard";
import DocumentationChecklist from "./DocumentationChecklist";
import PostDepartureSection from "./PostDepartureSection";
import { InfoRow, FileLink, EditBtn, fmtDate } from "./workspaceHelpers";

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

    case STAGE.DOCUMENTATION:
      return <DocumentationChecklist candidate={candidate} passport={passport} />;

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
          <InfoRow label="Insurance policy" value={ins?.insurancePolicyNumber} />
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
          <InfoRow label="Welfare receipt" value={ins?.welfareFundReceiptNumber} />
          {ins?.insurancePaidReceiptUrl && (
            <div className="mt-2">
              <FileLink url={ins.insurancePaidReceiptUrl} label="Insurance receipt" />
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

export default StageDetail;
