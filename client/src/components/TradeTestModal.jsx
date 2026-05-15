import { useState, useEffect } from 'react';
import { useTradeTest } from '../hooks/useTradeTest';
import { showToast } from './ToastProvider';

const RESULT_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'pass',    label: 'Pass' },
  { value: 'fail',    label: 'Fail' },
  { value: 'absent',  label: 'Absent' }
];

const isoDate = (d) => d ? d.split('T')[0] : '';

const TradeTestModal = ({ isOpen, onClose, record, candidateId, onSuccess }) => {
  const { create, update, loading } = useTradeTest();
  const [form, setForm] = useState({});
  const [certFile, setCertFile] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const isEdit = Boolean(record);

  useEffect(() => {
    if (!isOpen) return;
    if (record) {
      setForm({
        tradeCategory:          record.tradeCategory || '',
        testCenter:             record.testCenter || '',
        testCenterCode:         record.testCenterCode || '',
        testCenterLocation:     record.testCenterLocation || '',
        scheduledDate:          isoDate(record.scheduledDate),
        conductedDate:          isoDate(record.conductedDate),
        result:                 record.result || 'pending',
        certificateNumber:      record.certificateNumber || '',
        ctevtRegistrationNumber: record.ctevtRegistrationNumber || '',
        certificateIssuedDate:  isoDate(record.certificateIssuedDate),
        retestScheduledDate:    isoDate(record.retestScheduledDate),
        failReason:             record.failReason || '',
        absentReason:           record.absentReason || '',
        notes:                  record.notes || ''
      });
    } else {
      setForm({ result: 'pending', tradeCategory: '', testCenter: '', scheduledDate: '', conductedDate: '',
        certificateNumber: '', ctevtRegistrationNumber: '', retestScheduledDate: '', failReason: '', notes: '' });
    }
    setCertFile(null);
    setSubmitError('');
  }, [isOpen, record]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'certificateFile' && files?.length) {
      setCertFile(files[0]);
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
      if (certFile) payload.certificateFile = certFile;

      if (isEdit) {
        await update(record._id, payload);
        showToast('Trade test updated', 'success');
      } else {
        await create(payload);
        showToast('Trade test scheduled', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to save record');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-semibold">{isEdit ? 'Update Trade Test' : 'Schedule Trade Test'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trade / Skill Category</label>
              <input name="tradeCategory" value={form.tradeCategory || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="e.g. Plumbing, Welding" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
              <select name="result" value={form.result || 'pending'} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                {RESULT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Center</label>
              <input name="testCenter" value={form.testCenter || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="CTEVeT center name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Center Code</label>
              <input name="testCenterCode" value={form.testCenterCode || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="CTEVeT code" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input type="date" name="scheduledDate" value={form.scheduledDate || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conducted Date</label>
              <input type="date" name="conductedDate" value={form.conductedDate || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
          </div>

          {form.result === 'pass' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                <input name="certificateNumber" value={form.certificateNumber || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="CTEVeT cert number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTEVeT Reg Number</label>
                <input name="ctevtRegistrationNumber" value={form.ctevtRegistrationNumber || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  placeholder="Registration number" />
              </div>
            </div>
          )}

          {(form.result === 'fail' || form.result === 'absent') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.result === 'fail' ? 'Fail Reason' : 'Absent Reason'}
              </label>
              <input name={form.result === 'fail' ? 'failReason' : 'absentReason'}
                value={(form.result === 'fail' ? form.failReason : form.absentReason) || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
          )}

          {(form.result === 'fail' || form.result === 'absent') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retest Scheduled Date</label>
              <input type="date" name="retestScheduledDate" value={form.retestScheduledDate || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate File (optional)</label>
            <input type="file" name="certificateFile" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={handleChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            {certFile && <p className="text-xs text-gray-400 mt-1">Selected: {certFile.name}</p>}
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
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeTestModal;
