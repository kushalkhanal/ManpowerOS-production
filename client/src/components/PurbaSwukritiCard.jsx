import { Link } from 'react-router-dom';
import { BadgeCheck, FileText, ExternalLink, AlertCircle, Stamp } from 'lucide-react';
import { getRegionForCountry, REGION, getRegionMetadata } from '../domain/workflow';

/**
 * PurbaSwukritiCard
 *
 * Surfaces the Purba Swukriti (DoFE pre-approval) tracked on the candidate's
 * linked JobDemand. Read-only here — edits happen on the demand detail page
 * since one Purba Swukriti applies to all candidates allocated to that demand.
 *
 * The card is region-aware: Gulf candidates also see embassy attestation status,
 * since embassy attestation of the demand letter is a Gulf-only requirement.
 */

const fmtDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return null;
  }
};

const STATUS_BADGE = {
  issued:  'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  expiring:'bg-amber-100 text-amber-800',
  applied: 'bg-blue-100 text-blue-800',
  missing: 'bg-gray-100 text-gray-700'
};

function deriveStatus(demand, now) {
  if (!demand?.purbaSwukritiNumber) return 'missing';
  const expiry = demand.purbaSwukritiExpiryDate ? new Date(demand.purbaSwukritiExpiryDate) : null;
  if (!expiry) return 'issued';
  if (expiry < now) return 'expired';
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (expiry - now < thirtyDays) return 'expiring';
  return 'issued';
}

const STATUS_LABEL = {
  issued: 'Issued',
  expired: 'Expired',
  expiring: 'Expires soon',
  applied: 'Applied',
  missing: 'Not yet applied'
};

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-xs uppercase tracking-wide text-gray-400">{label}</span>
    <span className="text-sm text-gray-800 font-medium text-right">{value || '—'}</span>
  </div>
);

const FileLink = ({ url, label }) => {
  if (!url) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <FileText size={12} /> {label} (none)
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
    >
      <FileText size={12} /> {label} <ExternalLink size={11} />
    </a>
  );
};

const PurbaSwukritiCard = ({ demand, candidate }) => {
  const now = new Date();
  const country = candidate?.demandCountry || candidate?.desiredCountry || demand?.employerCountry || null;
  const region = getRegionForCountry(country);
  const isGulf = region === REGION.GULF;

  if (!demand) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <header className="flex items-center gap-2 mb-2">
          <BadgeCheck size={16} className="text-lime-600" />
          <h3 className="text-sm font-semibold text-gray-700">Purba Swukriti</h3>
        </header>
        <div className="text-xs text-gray-500">
          Allocate this candidate to a demand letter to track Purba Swukriti.
        </div>
      </div>
    );
  }

  const status = deriveStatus(demand, now);
  const issuedDateBS = demand.purbaSwukritiDateBS;
  const expiryDateBS = demand.purbaSwukritiExpiryDateBS;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-lime-50/60 to-white">
        <div className="flex items-center gap-2">
          <BadgeCheck size={16} className="text-lime-600" />
          <h3 className="text-sm font-semibold text-gray-700">Purba Swukriti</h3>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 ml-1">
            DoFE Pre-Approval
          </span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </header>

      <div className="px-5 py-4">
        {status === 'missing' ? (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-800">No Purba Swukriti recorded yet</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Apply to DoFE for the demand letter linked to this candidate, then record the
                approval number on the demand.
              </p>
            </div>
          </div>
        ) : (
          <dl>
            <Row label="Number"      value={demand.purbaSwukritiNumber} />
            <Row label="Issued"      value={issuedDateBS || fmtDate(demand.purbaSwukritiDate)} />
            <Row label="Expires"     value={expiryDateBS || fmtDate(demand.purbaSwukritiExpiryDate)} />
            <Row label="Demand No."  value={demand.demandLetterNumber} />
            <Row label="Employer"    value={demand.employerCompanyName} />
          </dl>
        )}

        {status === 'expired' && (
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              Purba Swukriti expired. Apply for renewal before the candidate can depart.
            </p>
          </div>
        )}
        {status === 'expiring' && (
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Purba Swukriti expires within 30 days.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <FileLink url={demand.demandLetterFileUrl}      label="Demand letter" />
          <FileLink url={demand.powerOfAttorneyFileUrl}   label="Power of Attorney" />
          {isGulf && (
            <FileLink url={demand.embassyAttestedDemandUrl} label="Embassy-attested demand" />
          )}
        </div>

        {isGulf && !demand.embassyAttestedDemandUrl && (
          <div className="mt-3 flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Stamp size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Gulf destination — embassy attestation of the demand letter is required before
              FEIMS submission.
            </p>
          </div>
        )}

        {demand._id && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link
              to={`/demands/${demand._id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Open demand to edit →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurbaSwukritiCard;
