import { useState, useEffect } from 'react';
import { useFees } from '../hooks/useFees';
import { TRANSACTION_TYPES, TRANSACTION_DIRECTION, PAYMENT_METHODS } from '../utils/constants';
import { showToast } from './ToastProvider';

const FeeModal = ({ isOpen, onClose, onSuccess, candidateId }) => {
  const { createTransaction, loading } = useFees();
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    candidateId: '',
    transactionType: '',
    direction: 'received',
    amountNPR: '',
    paymentMethod: '',
    transactionReference: '',
    notes: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        candidateId,
        transactionType: '',
        direction: 'received',
        amountNPR: '',
        paymentMethod: '',
        transactionReference: '',
        notes: ''
      });
      setReceiptFile(null);
      setErrors({});
    }
  }, [isOpen, candidateId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'receiptFile' && files?.length) {
      setReceiptFile(files[0]);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.transactionType) newErrors.transactionType = 'Type required';
    if (!formData.amountNPR || formData.amountNPR <= 0) newErrors.amountNPR = 'Valid amount required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        candidateId,
        receiptFile
      };
      await createTransaction(dataToSend);
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add Fee Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction Type *</label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select Type</option>
                {TRANSACTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.transactionType && <p className="text-red-500 text-xs mt-1">{errors.transactionType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Direction *</label>
              <select
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              >
                {TRANSACTION_DIRECTION.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (NPR) *</label>
              <input
                type="number"
                name="amountNPR"
                value={formData.amountNPR}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                placeholder="0"
                min="0"
              />
              {errors.amountNPR && <p className="text-red-500 text-xs mt-1">{errors.amountNPR}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select Method</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reference / Notes</label>
              <input
                type="text"
                name="transactionReference"
                value={formData.transactionReference}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                placeholder="eSewa ref, cheque no., etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Receipt</label>
              <input
                type="file"
                name="receiptFile"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </div>

          <div className="border-t px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeeModal;