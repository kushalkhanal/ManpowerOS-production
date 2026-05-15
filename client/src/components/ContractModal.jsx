import { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { showToast } from './ToastProvider';

const CONTRACT_STATUSES = [
  { value: 'draft',       label: 'Draft' },
  { value: 'signed',      label: 'Signed' },
  { value: 'active',      label: 'Active' },
  { value: 'expired',     label: 'Expired' },
  { value: 'terminated',  label: 'Terminated' },
  { value: 'renewed',     label: 'Renewed' }
];

const CURRENCIES = ['USD', 'QAR', 'SAR', 'AED', 'MYR', 'KRW', 'JPY', 'ILS', 'PLN', 'RON', 'HRK', 'NPR'];

const isoDate = (d) => d ? d.split('T')[0] : '';

const ContractModal = ({ isOpen, onClose, record, candidateId, onSuccess }) => {
  const { create, update, loading } = useContract();
  const [form, setForm] = useState({});
  const [contractFile, setContractFile] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const isEdit = Boolean(record);

  useEffect(() => {
    if (!isOpen) return;
    if (record) {
      setForm({
        contractType:           record.contractType || 'standard',
        contractLanguage:       record.contractLanguage || 'english',
        salary:                 record.salary || '',
        salaryCurrency:         record.salaryCurrency || 'USD',
        overtimeRatePerHour:    record.overtimeRatePerHour || '',
        workingHoursPerDay:     record.workingHoursPerDay || '',
        workingDaysPerWeek:     record.workingDaysPerWeek || '',
        accommodation:          record.accommodation || 'provided',
        food:                   record.food || 'provided',
        leavePerYear:           record.leavePerYear || '',
        contractDurationMonths: record.contractDurationMonths || '',
        contractStartDate:      isoDate(record.contractStartDate),
        actualStartDate:        isoDate(record.actualStartDate),
        contractExpiryDate:     isoDate(record.contractExpiryDate),
        status:                 record.status || 'draft',
        terminationReason:      record.terminationReason || '',
        terminationDate:        isoDate(record.terminationDate),
        dofeApprovalNumber:     record.dofeApprovalNumber || '',
        dofeApprovedAt:         isoDate(record.dofeApprovedAt),
        notes:                  record.notes || ''
      });
    } else {
      setForm({
        contractType: 'standard', contractLanguage: 'english',
        salary: '', salaryCurrency: 'USD', accommodation: 'provided', food: 'provided',
        contractDurationMonths: '', contractStartDate: '', status: 'draft', notes: ''
      });
    }
    setContractFile(null);
    setSubmitError('');
  }, [isOpen, record]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'contractFile' && files?.length) {
      setContractFile(files[0]);
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const payload = { ...form };
      if (!isEdit) payload.candidateId = candidateId;
      if (contractFile) payload.contractFile = contractFile;

      if (isEdit) {
        await update(record._id, payload);
        showToast.success('Contract updated');
      } else {
        await create(payload);
        showToast.success('Contract created');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to save contract');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-semibold">{isEdit ? 'Update Contract' : 'New Worker Contract'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Contract type & status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
              <select name="contractType" value={form.contractType || 'standard'} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                <option value="standard">Standard</option>
                <option value="dofe_approved">DoFE Approved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select name="contractLanguage" value={form.contractLanguage || 'english'} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                <option value="english">English</option>
                <option value="nepali">Nepali</option>
                <option value="arabic">Arabic</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={form.status || 'draft'} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                {CONTRACT_STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Compensation */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Compensation</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                <input type="number" name="salary" value={form.salary || ''} onChange={handleChange} min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Monthly salary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select name="salaryCurrency" value={form.salaryCurrency || 'USD'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OT Rate/Hour</label>
                <input type="number" name="overtimeRatePerHour" value={form.overtimeRatePerHour || ''} onChange={handleChange} min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Work conditions */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Work Conditions</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Day</label>
                <input type="number" name="workingHoursPerDay" value={form.workingHoursPerDay || ''} onChange={handleChange} min="1" max="24"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Days/Week</label>
                <input type="number" name="workingDaysPerWeek" value={form.workingDaysPerWeek || ''} onChange={handleChange} min="1" max="7"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave/Year</label>
                <input type="number" name="leavePerYear" value={form.leavePerYear || ''} onChange={handleChange} min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation</label>
                <select name="accommodation" value={form.accommodation || 'provided'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                  <option value="provided">Provided</option>
                  <option value="allowance">Allowance</option>
                  <option value="self">Self-arranged</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food</label>
                <select name="food" value={form.food || 'provided'} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                  <option value="provided">Provided</option>
                  <option value="allowance">Allowance</option>
                  <option value="self">Self-arranged</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contract duration & dates */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duration & Dates</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
                <input type="number" name="contractDurationMonths" value={form.contractDurationMonths || ''} onChange={handleChange} min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="e.g. 24" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" name="contractStartDate" value={form.contractStartDate || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" name="contractExpiryDate" value={form.contractExpiryDate || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Auto-calculated" />
              </div>
            </div>
          </div>

          {/* DoFE approval */}
          {form.contractType === 'dofe_approved' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DoFE Approval Number</label>
                <input name="dofeApprovalNumber" value={form.dofeApprovalNumber || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DoFE Approved At</label>
                <input type="date" name="dofeApprovedAt" value={form.dofeApprovedAt || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
            </div>
          )}

          {/* Termination */}
          {form.status === 'terminated' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Termination Reason</label>
                <textarea name="terminationReason" rows={2} value={form.terminationReason || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Termination Date</label>
                <input type="date" name="terminationDate" value={form.terminationDate || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
            </div>
          )}

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract File (optional)</label>
            <input type="file" name="contractFile" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={handleChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            {contractFile && <p className="text-xs text-gray-400 mt-1">Selected: {contractFile.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={2} value={form.notes || ''} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          </div>

          {submitError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{submitError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractModal;
