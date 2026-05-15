import { useMemo } from 'react';
import { getDepartureGateRequirements } from '../domain/workflow';
import { CheckCircle2, XCircle, PlaneTakeoff } from 'lucide-react';

// ─── Evaluator ────────────────────────────────────────────────────────────────
// Pure function — call from the workspace page to get the badge count too.

const SIX_MONTHS_MS = 183 * 24 * 60 * 60 * 1000;

export function evaluateGate(kanbanData) {
  const { candidate, passport, demand, columns } = kanbanData;
  const country = candidate.demandCountry || candidate.desiredCountry || '';

  const requirements = getDepartureGateRequirements(country);
  const col = (id) => columns?.find(c => c.id === id)?.data;

  const medical   = col('medical');
  const insurance = col('insurance');
  const ori       = col('dofe')?.orientation;
  const now       = Date.now();

  const results = requirements.map(req => {
    let pass = false;
    let note = null;

    switch (req.id) {
      case 'passport_valid': {
        if (!passport?.expiryDate) { note = 'No passport linked'; break; }
        const rem = new Date(passport.expiryDate).getTime() - now;
        pass = rem > SIX_MONTHS_MS;
        if (!pass) {
          const days = Math.ceil(rem / 86400000);
          note = days <= 0 ? 'Passport expired' : `Only ${days}d remaining — needs 6 months`;
        }
        break;
      }
      case 'demand_letter_valid': {
        if (!demand) { note = 'No demand allocated'; break; }
        if (!demand.demandLetterExpiryDate) { pass = true; break; }
        pass = new Date(demand.demandLetterExpiryDate).getTime() > now;
        if (!pass) note = 'Demand letter has expired';
        break;
      }
      case 'documents_complete': {
        pass = Boolean(passport?.passportNumber);
        if (!pass) note = 'Passport not yet collected';
        break;
      }
      case 'medical_fit': {
        pass = medical?.result === 'fit';
        note = !pass
          ? (medical?.result ? `Result: ${medical.result}` : 'No medical record on file')
          : null;
        break;
      }
      case 'medical_not_expired': {
        if (!medical?.reportExpiryDate) {
          // Fit result but no expiry date recorded — treat as cautiously ok
          pass = medical?.result === 'fit';
          if (!medical) note = 'No medical record on file';
          break;
        }
        pass = new Date(medical.reportExpiryDate).getTime() > now;
        if (!pass) note = 'Medical fitness report has expired';
        break;
      }
      case 'orientation_complete': {
        pass = ori?.completionStatus === 'completed';
        note = !pass
          ? (ori ? `Status: ${ori.completionStatus}` : 'Orientation not started')
          : null;
        break;
      }
      case 'insurance_paid': {
        pass = Boolean(insurance?.insurancePolicyNumber);
        note = !pass ? 'No insurance policy number recorded' : null;
        break;
      }
      case 'ssf_paid': {
        pass = Boolean(insurance?.ssfReceiptNumber);
        note = !pass ? 'No SSF receipt number recorded' : null;
        break;
      }
      case 'welfare_paid': {
        pass = insurance?.welfareFundPaid === true;
        note = !pass
          ? (insurance?.welfareFundPaid === false ? 'Marked as not paid' : 'Not recorded')
          : null;
        break;
      }
      case 'purba_swukriti_valid': {
        pass = Boolean(candidate.purbaSwukritiNumber);
        note = !pass ? 'Purba Swukriti not issued' : null;
        break;
      }
      case 'feims_registered': {
        pass = Boolean(candidate.feimsRegistrationNumber);
        note = !pass ? 'Not registered on FEIMS portal' : null;
        break;
      }
      case 'shram_issued': {
        pass = Boolean(candidate.shramSwikritiNumber);
        note = !pass ? 'Shram Swukriti not issued by DoFE' : null;
        break;
      }
      case 'visa_stamped': {
        pass = Boolean(candidate.visaNumber && candidate.visaStampedDate);
        note = !pass
          ? (candidate.visaNumber ? 'Stamp date not recorded' : 'Visa not yet stamped')
          : null;
        break;
      }
      case 'vln_received': {
        pass = Boolean(candidate.vlnNumber);
        note = !pass ? 'VLN / VDR calling letter not received' : null;
        break;
      }
      case 'plks_received': {
        pass = Boolean(candidate.plksNumber);
        note = !pass ? 'PLKS e-sticker not received' : null;
        break;
      }
      default:
        note = 'Manual check required';
    }

    return { ...req, pass, note };
  });

  const passCount  = results.filter(r => r.pass).length;
  const totalCount = results.length;
  const failCount  = totalCount - passCount;
  const ready      = failCount === 0;

  return { results, passCount, totalCount, failCount, ready };
}

// ─── Panel ────────────────────────────────────────────────────────────────────

const DepartureGatePanel = ({ kanbanData }) => {
  const { results, passCount, totalCount, failCount, ready } = useMemo(
    () => evaluateGate(kanbanData),
    [kanbanData]
  );

  const summaryColor = ready
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : failCount <= 2
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-red-50 border-red-100 text-red-700';

  const iconColor = ready ? 'text-emerald-500' : failCount <= 2 ? 'text-amber-500' : 'text-red-400';

  return (
    <div className="mt-3">
      {/* Summary banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-3 ${summaryColor}`}>
        <PlaneTakeoff size={17} className={`flex-shrink-0 ${iconColor}`} />
        <div>
          <p className="text-sm font-bold leading-tight">
            {ready
              ? 'Cleared for departure'
              : `${failCount} item${failCount === 1 ? '' : 's'} need${failCount === 1 ? 's' : ''} attention`}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            {passCount} of {totalCount} departure checks passed
          </p>
        </div>
      </div>

      {/* Checklist — failed items first, then passed */}
      <div className="space-y-px">
        {[...results].sort((a, b) => (a.pass ? 1 : 0) - (b.pass ? 1 : 0)).map(req => (
          <div
            key={req.id}
            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              req.pass ? 'opacity-60' : 'bg-red-50/60'
            }`}
          >
            {req.pass
              ? <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              : <XCircle     size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${req.pass ? 'text-gray-400' : 'text-gray-800 font-medium'}`}>
                {req.label}
              </p>
              {!req.pass && req.note && (
                <p className="text-xs text-red-500 mt-0.5">{req.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartureGatePanel;
