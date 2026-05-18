import { useState, useEffect, useCallback } from 'react';
import { useFees } from '../hooks/useFees';
import FeeModal from './FeeModal';
import { formatNPR, formatDateNPR } from '../utils/currency';
import { TRANSACTION_TYPE_LABELS } from '../constants/statuses';

const formatDateBS = formatDateNPR;

const FeeCard = ({ candidateId, serviceFeeAgreed }) => {
  const { getCandidateSummary, loading } = useFees();
  const [showAddModal, setShowAddModal] = useState(false);
  const [data, setData] = useState({ transactions: [], summary: {} });

  const loadData = useCallback(async () => {
    const result = await getCandidateSummary(candidateId);
    if (result) setData(result);
  }, [candidateId, getCandidateSummary]);

  useEffect(() => {
    if (candidateId) loadData();
  }, [candidateId, loadData]);

  const { transactions, summary } = data;

  if (loading && !transactions?.length) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Transactions</h3>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Fee Transactions</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm text-primary-600 hover:text-primary-500"
        >
          + Add Payment
        </button>
      </div>

      {transactions?.length === 0 ? (
        <p className="text-gray-500 text-sm">No transactions yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                <th className="text-left py-2 text-gray-500 font-medium">Dir</th>
                <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-2 text-gray-500 font-medium">Method</th>
                <th className="text-right py-2 text-gray-500 font-medium">Date (BS)</th>
                <th className="text-left py-2 text-gray-500 font-medium">By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2">{TRANSACTION_TYPE_LABELS[t.transactionType] || t.transactionType}</td>
                  <td className="py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      t.direction === 'received' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t.direction === 'received' ? 'In' : 'Out'}
                    </span>
                  </td>
                  <td className={`py-2 text-right font-medium ${
                    t.direction === 'received' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.direction === 'received' ? '+' : '-'}{formatNPR(t.amountNPR)}
                  </td>
                  <td className="py-2 capitalize">{t.paymentMethod || '-'}</td>
                  <td className="py-2 text-right">{formatDateBS(t.paidAt)}</td>
                  <td className="py-2">{t.receivedBy?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 pt-4 border-t flex justify-between text-sm">
        <div>
          <span className="text-gray-500">Total Received:</span>
          <span className="ml-2 font-semibold text-green-600">{formatNPR(summary.totalReceived)}</span>
        </div>
        <div>
          <span className="text-gray-500">Total Cost:</span>
          <span className="ml-2 font-semibold text-red-600">{formatNPR(summary.totalPaid)}</span>
        </div>
        <div>
          <span className="text-gray-500">Outstanding:</span>
          <span className={`ml-2 font-semibold ${summary.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatNPR(summary.outstanding)}
          </span>
        </div>
      </div>

      {showAddModal && (
        <FeeModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
          candidateId={candidateId}
        />
      )}
    </div>
  );
};

export default FeeCard;