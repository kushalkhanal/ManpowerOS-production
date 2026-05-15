import { CheckCircle2, XCircle, AlertTriangle, PlaneTakeoff, Loader2 } from 'lucide-react';
import useDepartureGate from '../../hooks/useDepartureGate.js';

/**
 * Renders the full departure readiness checklist for a candidate.
 * Blocks visual departure confirmation until all 12 requirements pass.
 *
 * Props:
 *   candidateId {string}
 *   onReady     {function} — called when all checks pass (optional)
 */
export function DepartureGateCard({ candidateId, onReady }) {
  const { data, loading, error, refetch } = useDepartureGate(candidateId);

  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-3 text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Checking departure readiness…</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      {error}
    </div>
  );

  if (!data) return null;

  const { ready, blockers, checks } = data;

  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;
  const pct = Math.round((passed / total) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 flex items-center gap-3 ${
        ready ? 'bg-green-50 border-b border-green-100' : 'bg-amber-50 border-b border-amber-100'
      }`}>
        <PlaneTakeoff className={`w-5 h-5 flex-shrink-0 ${ready ? 'text-green-600' : 'text-amber-500'}`} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">Departure Gate Checklist</h3>
          <p className={`text-xs mt-0.5 ${ready ? 'text-green-700' : 'text-amber-700'}`}>
            {ready
              ? 'All requirements met — candidate is cleared for departure'
              : `${blockers.length} requirement${blockers.length > 1 ? 's' : ''} pending`
            }
          </p>
        </div>
        {/* Progress ring shorthand */}
        <span className={`text-sm font-bold ${ready ? 'text-green-700' : 'text-amber-700'}`}>
          {passed}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-1 transition-all duration-500 ${ready ? 'bg-green-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Check list */}
      <ul className="divide-y divide-gray-50">
        {checks.map(check => (
          <li key={check.id} className="px-5 py-3 flex items-start gap-3">
            {check.passed
              ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            }
            <div className="min-w-0">
              <p className={`text-sm ${check.passed ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                {check.label}
              </p>
              {check.detail && (
                <p className="text-xs text-gray-500 mt-0.5">{check.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Blockers summary */}
      {!ready && (
        <div className="px-5 py-4 bg-red-50 border-t border-red-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-700 mb-1">
                Cannot mark flight booked until resolved:
              </p>
              <ul className="space-y-0.5">
                {blockers.map((b, i) => (
                  <li key={i} className="text-xs text-red-600">• {b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cleared CTA */}
      {ready && onReady && (
        <div className="px-5 py-3 bg-green-50 border-t border-green-100">
          <button
            onClick={onReady}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlaneTakeoff className="w-4 h-4" />
            Confirm Departure Ready
          </button>
        </div>
      )}

      {/* Refresh link */}
      <div className="px-5 py-2 border-t border-gray-100">
        <button
          onClick={refetch}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Refresh checks
        </button>
      </div>
    </div>
  );
}

export default DepartureGateCard;
