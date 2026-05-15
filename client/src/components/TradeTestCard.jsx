import { useState, useEffect } from 'react';
import { useTradeTest } from '../hooks/useTradeTest';
import TradeTestModal from './TradeTestModal';
import { ClipboardList, Plus, Pencil, ExternalLink, Calendar, AlertTriangle } from 'lucide-react';

const RESULT_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  pass:    'bg-emerald-100 text-emerald-700',
  fail:    'bg-red-100 text-red-700',
  absent:  'bg-amber-100 text-amber-700',
};

const RESULT_LABELS = { pending: 'Pending', pass: 'Pass', fail: 'Fail', absent: 'Absent' };

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const daysUntil = (d) => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;

const TradeTestCard = ({ candidateId }) => {
  const { tradeTests, loading, getByCandidate } = useTradeTest();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (candidateId) getByCandidate(candidateId);
  }, [candidateId]);

  const handleSuccess = () => getByCandidate(candidateId);

  if (loading) return (
    <div className="space-y-2 mt-3">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          {tradeTests.length} record{tradeTests.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => { setSelected(null); setShowModal(true); }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Plus size={12} /> Schedule New
        </button>
      </div>

      {tradeTests.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <ClipboardList size={20} className="text-gray-300" />
          <p className="text-xs text-gray-400">No trade test records yet.</p>
          <button
            onClick={() => { setSelected(null); setShowModal(true); }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus size={11} /> Schedule first test
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tradeTests.map((tt) => {
            const expDays = daysUntil(tt.expiryDate);
            const isExpiring = tt.result === 'pass' && expDays !== null && expDays > 0 && expDays <= 60;
            const isExpired  = tt.result === 'pass' && expDays !== null && expDays <= 0;

            return (
              <div key={tt._id} className="border border-gray-100 rounded-xl p-3 bg-white hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {tt.tradeCategory || 'Trade category N/A'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${RESULT_COLORS[tt.result] || 'bg-gray-100 text-gray-600'}`}>
                        {RESULT_LABELS[tt.result] || tt.result}
                      </span>
                    </div>

                    {tt.testCenter && (
                      <p className="mt-0.5 text-xs text-gray-500">{tt.testCenter}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-400">
                      {tt.scheduledDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={10} /> Scheduled {fmt(tt.scheduledDate)}
                        </span>
                      )}
                      {tt.conductedDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={10} /> Conducted {fmt(tt.conductedDate)}
                        </span>
                      )}
                    </div>

                    {(tt.certificateNumber || tt.ctevtRegistrationNumber) && (
                      <p className="mt-1 text-[11px] text-gray-400">
                        {tt.certificateNumber && <>Cert# {tt.certificateNumber}</>}
                        {tt.certificateNumber && tt.ctevtRegistrationNumber && ' · '}
                        {tt.ctevtRegistrationNumber && <>CTEVeT Reg# {tt.ctevtRegistrationNumber}</>}
                      </p>
                    )}

                    {tt.expiryDate && tt.result === 'pass' && !isExpiring && !isExpired && (
                      <p className="mt-1 text-[11px] text-gray-400">
                        Cert expires {fmt(tt.expiryDate)}
                      </p>
                    )}

                    {(isExpiring || isExpired) && (
                      <p className={`mt-1 text-[11px] font-semibold inline-flex items-center gap-1 ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                        <AlertTriangle size={11} />
                        {isExpired ? `Cert expired ${-expDays}d ago` : `Cert expires in ${expDays}d`}
                      </p>
                    )}

                    {tt.failReason && (
                      <p className="mt-1 text-[11px] text-red-600">Reason: {tt.failReason}</p>
                    )}
                    {tt.retestScheduledDate && (
                      <p className="mt-0.5 text-[11px] text-amber-600 inline-flex items-center gap-1">
                        <Calendar size={10} /> Retest {fmt(tt.retestScheduledDate)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setSelected(tt); setShowModal(true); }}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors"
                      title="Update trade test"
                    >
                      <Pencil size={13} />
                    </button>
                    {tt.certificateFileUrl && (
                      <a
                        href={tt.certificateFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded transition-colors"
                        title="View certificate"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <TradeTestModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setSelected(null); }}
          record={selected}
          candidateId={candidateId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default TradeTestCard;
