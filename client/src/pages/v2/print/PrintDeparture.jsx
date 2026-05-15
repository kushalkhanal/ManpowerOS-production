import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { feimsApi } from '../../../api';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const GateRow = ({ check }) => {
  const { label, passed, note, critical } = check;
  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 rounded-lg border mb-1.5 ${
      passed
        ? 'bg-green-50 border-green-200'
        : critical
          ? 'bg-red-50 border-red-300'
          : 'bg-orange-50 border-orange-200'
    }`}>
      <span className={`text-lg mt-0.5 shrink-0 ${passed ? 'text-green-600' : critical ? 'text-red-600' : 'text-orange-500'}`}>
        {passed ? '✓' : '✗'}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${passed ? 'text-green-800' : critical ? 'text-red-700' : 'text-orange-700'}`}>
          {label}
        </p>
        {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
      </div>
      {critical && !passed && (
        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 bg-red-600 text-white rounded-full">BLOCKING</span>
      )}
    </div>
  );
};

const PrintDeparture = () => {
  const { candidateId } = useParams();
  const [gate, setGate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    feimsApi.getDepartureGate(candidateId)
      .then(r => setGate(r.data?.data ?? r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load departure gate'));
  }, [candidateId]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!gate) return <div className="p-8 text-gray-400">Loading…</div>;

  const { candidate: c, checks = [], ready, blockedBy = [] } = gate;
  const passedCount = checks.filter(ch => ch.passed).length;
  const printedAt = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: 'Inter', system-ui, sans-serif; background: white; }
      `}</style>

      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg shadow hover:bg-primary/90 transition-colors">
          Print / Save PDF
        </button>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg shadow hover:bg-gray-200 transition-colors">
          Close
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto px-8 py-8 bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-emerald-600">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">Departure Clearance Summary</h1>
            <p className="text-xs text-gray-400 mt-0.5">Pre-Departure Gate Check — Nepal DoFE</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Generated: {printedAt}</p>
          </div>
        </div>

        {/* Candidate + READY/BLOCKED badge */}
        <div className={`rounded-xl border-2 px-5 py-4 mb-6 flex items-center justify-between ${
          ready ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
        }`}>
          <div>
            <p className="text-xl font-bold text-gray-900">{c?.fullName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c?.desiredCountry} · {c?.desiredJobCategory}</p>
            {c?.flightDate && (
              <p className="text-sm font-semibold text-gray-700 mt-1">
                Flight: {c.flightNumber || '—'} · {fmt(c.flightDate)}
                {c.airline && ` · ${c.airline}`}
              </p>
            )}
          </div>
          <div className="text-center">
            <div className={`text-3xl font-black ${ready ? 'text-green-600' : 'text-red-600'}`}>
              {ready ? 'READY' : 'BLOCKED'}
            </div>
            <p className="text-xs text-gray-500 mt-1">{passedCount}/{checks.length} checks passed</p>
          </div>
        </div>

        {/* Blocking issues */}
        {blockedBy.length > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-5">
            <p className="text-sm font-bold text-red-700 mb-2">Blocking Issues</p>
            <ul className="space-y-1">
              {blockedBy.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-red-600">
                  <span>✗</span> {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* All gate checks */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Gate Checks</h3>
          {checks.map((check, i) => (
            <GateRow key={check.key || i} check={check} />
          ))}
        </div>

        {/* Airport info */}
        {c?.airportReportingTime && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-4 text-sm">
            <span className="text-xl">✈</span>
            <div>
              <p className="font-semibold text-gray-800">Airport Reporting Time: {c.airportReportingTime}</p>
              <p className="text-xs text-gray-500">Ensure candidate arrives at least 3 hours before departure</p>
            </div>
          </div>
        )}

        {/* Signature block */}
        <div className="mt-10 pt-6 border-t border-gray-200 grid grid-cols-3 gap-8">
          {['Agency Officer', 'DoFE Officer', 'Airport Clearance'].map(label => (
            <div key={label} className="text-center">
              <div className="h-14 border-b border-gray-400 mb-2" />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-4">
          ManpowerOS · Departure Clearance · {printedAt}
        </p>
      </div>
    </>
  );
};

export default PrintDeparture;
