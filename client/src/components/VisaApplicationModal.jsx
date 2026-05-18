import { useState, useEffect } from 'react';
import { useVisa } from '../hooks/useVisa';
import { showToast } from './ToastProvider';

const STATUS_OPTIONS = [
  { value: 'not_started',          label: 'Not Started' },
  { value: 'calling_visa_pending', label: 'Calling Visa Pending' },
  { value: 'appointed',            label: 'Appointed' },
  { value: 'submitted',            label: 'Submitted' },
  { value: 'stamped',              label: 'Stamped' },
  { value: 'rejected',             label: 'Rejected' },
  { value: 'cancelled',            label: 'Cancelled' }
];

const VISA_TYPES = [
  { value: 'employment',       label: 'Employment Visa' },
  { value: 'work_permit',      label: 'Work Permit' },
  { value: 'eps',              label: 'EPS (Korea)' },
  { value: 'specified_skilled', label: 'Specified Skilled (Japan)' },
  { value: 'special',          label: 'Special Visa' }
];

const isoDate = (d) => d ? d.split('T')[0] : '';

const VisaApplicationModal = ({ isOpen, onClose, record, candidateId, onSuccess }) => {
  const { create, update, loading } = useVisa();
  const [form, setForm] = useState({});
  const [visaFile, setVisaFile] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const isEdit = Boolean(record);

  useEffect(() => {
    if (!isOpen) return;
    if (record) {
      setForm({
        country:                record.country || '',
        visaType:               record.visaType || 'employment',
        embassyName:            record.embassyName || '',
        embassyCity:            record.embassyCity || '',
        callingVisaNumber:      record.callingVisaNumber || '',
        callingVisaReceivedDate: isoDate(record.callingVisaReceivedDate),
        applicationRef:         record.applicationRef || '',
        appointmentDate:        isoDate(record.appointmentDate),
        submittedDate:          isoDate(record.submittedDate),
        status:                 record.status || 'not_started',
        visaNumber:             record.visaNumber || '',
        visaIssuedDate:         isoDate(record.visaIssuedDate),
        visaExpiryDate:         isoDate(record.visaExpiryDate),
        rejectionReason:        record.rejectionReason || '',
        eStickerNumber:         record.eStickerNumber || '',
        eStickerIssuedDate:     isoDate(record.eStickerIssuedDate),
        eStickerExpiryDate:     isoDate(record.eStickerExpiryDate),
        notes:                  record.notes || ''
      });
    } else {
      setForm({ status: 'not_started', visaType: 'employment', country: '', embassyName: '',
        embassyCity: '', callingVisaNumber: '', applicationRef: '', appointmentDate: '', notes: '' });
    }
    setVisaFile(null);
    setSubmitError('');
  }, [isOpen, record]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'visaFile' && files?.length) {
      setVisaFile(files[0]);
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
      if (visaFile) payload.visaFile = visaFile;

      if (isEdit) {
        await update(record._id, payload);
        showToast('Visa application updated', 'success');
      } else {
        await create(payload);
        showToast('Visa application created', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to save visa application');
    }
  };

  if (!isOpen) return null;

  const showSamped = form.status === 'stamped';
  const showRejection = form.status === 'rejected';
  const showCallingVisa = ['calling_visa_pending', 'appointed', 'submitted', 'stamped'].includes(form.status);
  const showESticker = showSamped;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-semibold">{isEdit ? 'Update Visa Application' : 'New Visa Application'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input name="country" value={form.country || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="e.g. Qatar" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type</label>
              <select name="visaType" value={form.visaType || 'employment'} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
                {VISA_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Embassy Name</label>
              <input name="embassyName" value={form.embassyName || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Embassy of Qatar" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Embassy City</label>
              <input name="embassyCity" value={form.embassyCity || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="Kathmandu" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={form.status || 'not_started'} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {showCallingVisa && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calling Visa Number</label>
                <input name="callingVisaNumber" value={form.callingVisaNumber || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calling Visa Received</label>
                <input type="date" name="callingVisaReceivedDate" value={form.callingVisaReceivedDate || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Ref</label>
              <input name="applicationRef" value={form.applicationRef || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
              <input type="date" name="appointmentDate" value={form.appointmentDate || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
          </div>

          {form.status !== 'not_started' && form.status !== 'calling_visa_pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Date</label>
              <input type="date" name="submittedDate" value={form.submittedDate || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
          )}

          {showSamped && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Number</label>
                <input name="visaNumber" value={form.visaNumber || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issued Date</label>
                <input type="date" name="visaIssuedDate" value={form.visaIssuedDate || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" name="visaExpiryDate" value={form.visaExpiryDate || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
            </div>
          )}

          {showESticker && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Sticker Number</label>
                <input name="eStickerNumber" value={form.eStickerNumber || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Sticker Issued</label>
                <input type="date" name="eStickerIssuedDate" value={form.eStickerIssuedDate || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Sticker Expiry</label>
                <input type="date" name="eStickerExpiryDate" value={form.eStickerExpiryDate || ''} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
            </div>
          )}

          {showRejection && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea name="rejectionReason" rows={2} value={form.rejectionReason || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visa File (optional)</label>
            <input type="file" name="visaFile" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={handleChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            {visaFile && <p className="text-xs text-gray-400 mt-1">Selected: {visaFile.name}</p>}
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

export default VisaApplicationModal;
