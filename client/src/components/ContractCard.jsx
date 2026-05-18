import { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import ContractModal from './ContractModal';

const STATUS_COLORS = {
  draft:       'bg-gray-100 text-gray-700',
  signed:      'bg-blue-100 text-blue-700',
  active:      'bg-green-100 text-green-800',
  expired:     'bg-red-100 text-red-800',
  terminated:  'bg-red-200 text-red-900',
  renewed:     'bg-teal-100 text-teal-700'
};

const STATUS_LABELS = {
  draft: 'Draft', signed: 'Signed', active: 'Active',
  expired: 'Expired', terminated: 'Terminated', renewed: 'Renewed'
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ContractCard = ({ candidateId }) => {
  const { contracts, loading, getByCandidate } = useContract();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (candidateId) getByCandidate(candidateId);
  }, [candidateId]);

  const handleSuccess = () => getByCandidate(candidateId);

  if (loading) return <div className="bg-white shadow rounded-lg p-6 text-sm text-gray-500">Loading contracts...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Worker Contract</h2>
        <button
          onClick={() => { setSelected(null); setShowModal(true); }}
          className="text-sm text-primary-600 hover:text-primary-900"
        >
          + New Contract
        </button>
      </div>

      {contracts.length === 0 ? (
        <p className="text-sm text-gray-500">No contracts yet.</p>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => {
            const daysLeft = c.contractExpiryDate
              ? Math.ceil((new Date(c.contractExpiryDate) - new Date()) / (1000 * 60 * 60 * 24))
              : null;
            const nearExpiry = c.status === 'active' && daysLeft !== null && daysLeft <= 60 && daysLeft > 0;

            return (
              <div key={c._id} className="border border-gray-200 rounded-lg p-4">
                {nearExpiry && (
                  <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                    Contract expires in {daysLeft} days — consider renewal
                  </div>
                )}
                {daysLeft !== null && daysLeft <= 0 && c.status === 'active' && (
                  <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    Contract has expired
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                      {c.contractType === 'dofe_approved' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          DoFE Approved
                        </span>
                      )}
                    </div>

                    {(c.salary || c.salaryCurrency) && (
                      <p className="text-sm font-medium text-gray-900">
                        {c.salary ? `${c.salary.toLocaleString()} ${c.salaryCurrency}` : '—'} / month
                      </p>
                    )}

                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-0.5">
                      {c.contractDurationMonths && <span>Duration: {c.contractDurationMonths} months</span>}
                      {c.workingHoursPerDay && <span>Hours: {c.workingHoursPerDay}h/day</span>}
                      {c.accommodation !== undefined && <span>Accom: {c.accommodation}</span>}
                    </div>

                    <div className="text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-0.5">
                      {c.contractStartDate && <span>Start: {fmt(c.contractStartDate)}</span>}
                      {c.contractExpiryDate && <span>Expires: {fmt(c.contractExpiryDate)}</span>}
                    </div>

                    {c.dofeApprovalNumber && (
                      <p className="text-xs text-gray-600">DoFE Approval#: {c.dofeApprovalNumber}</p>
                    )}

                    {c.renewalCount > 0 && (
                      <p className="text-xs text-teal-600">Renewed {c.renewalCount} time(s)</p>
                    )}

                    {c.terminationReason && (
                      <p className="text-xs text-red-600">Terminated: {c.terminationReason}</p>
                    )}

                    {c.contractFileUrl && (
                      <a href={c.contractFileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:underline inline-block mt-1">
                        View contract →
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelected(c); setShowModal(true); }}
                    className="text-sm text-primary-600 hover:text-primary-900 shrink-0 ml-3"
                  >
                    Update
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ContractModal
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

export default ContractCard;
