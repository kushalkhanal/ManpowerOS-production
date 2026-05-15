import { useState, useEffect } from 'react';
import { useInsuranceSsf } from '../hooks/useInsuranceSsf';
import { isValidFileSize, isValidFileType } from '../utils/validation';

const InsuranceModal = ({ isOpen, onClose, candidateId, candidateData, onSuccess }) => {
  const { getByCandidate, record, loading, create, update } = useInsuranceSsf();
  const [editData, setEditData] = useState({});
  const [insuranceReceiptFile, setInsuranceReceiptFile] = useState(null);
  const [ssfReceiptFile, setSsfReceiptFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
  const maxFileSize = 10 * 1024 * 1024;
  const resolveFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_SERVER_URL || ''}${url}`;
  };

  useEffect(() => {
    if (candidateId && isOpen) {
      getByCandidate(candidateId);
    }
  }, [candidateId, isOpen]);

  useEffect(() => {
    if (record) {
      setEditData({
        insurancePolicyNumber: record.insurancePolicyNumber || '',
        insuranceCompany: record.insuranceCompany || '',
        insurancePremiumNPR: record.insurancePremiumNPR || '',
        insurancePaidDate: record.insurancePaidDate ? record.insurancePaidDate.split('T')[0] : '',
        insuranceCoverageYears: record.insuranceCoverageYears || 2,
        ssfRegistrationNumber: record.ssfRegistrationNumber || '',
        ssfContributionNPR: record.ssfContributionNPR || '',
        ssfPaidDate: record.ssfPaidDate ? record.ssfPaidDate.split('T')[0] : '',
        ssfReceiptNumber: record.ssfReceiptNumber || '',
        welfareFundPaid: record.welfareFundPaid || false,
        welfareFundAmount: record.welfareFundAmount || '',
        welfareFundReceiptNumber: record.welfareFundReceiptNumber || '',
        welfareFundPaidDate: record.welfareFundPaidDate ? record.welfareFundPaidDate.split('T')[0] : '',
        notes: record.notes || ''
      });
    } else {
      setEditData({
        insurancePolicyNumber: '',
        insuranceCompany: '',
        insurancePremiumNPR: '',
        insurancePaidDate: '',
        insuranceCoverageYears: 2,
        ssfRegistrationNumber: '',
        ssfContributionNPR: '',
        ssfPaidDate: '',
        ssfReceiptNumber: '',
        welfareFundPaid: false,
        welfareFundAmount: '',
        welfareFundReceiptNumber: '',
        welfareFundPaidDate: '',
        notes: ''
      });
    }
    setInsuranceReceiptFile(null);
    setSsfReceiptFile(null);
  }, [record, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'insuranceReceiptFile' && files?.length) {
      const selectedFile = files[0];
      if (!isValidFileType(selectedFile, allowedFileTypes)) {
        setErrors(prev => ({ ...prev, insuranceReceiptFile: 'Only JPG, PNG, WEBP, and PDF are allowed' }));
        return;
      }
      if (!isValidFileSize(selectedFile, maxFileSize)) {
        setErrors(prev => ({ ...prev, insuranceReceiptFile: 'File must be 10MB or smaller' }));
        return;
      }
      setInsuranceReceiptFile(selectedFile);
      setErrors(prev => ({ ...prev, insuranceReceiptFile: '' }));
    } else if (name === 'ssfReceiptFile' && files?.length) {
      const selectedFile = files[0];
      if (!isValidFileType(selectedFile, allowedFileTypes)) {
        setErrors(prev => ({ ...prev, ssfReceiptFile: 'Only JPG, PNG, WEBP, and PDF are allowed' }));
        return;
      }
      if (!isValidFileSize(selectedFile, maxFileSize)) {
        setErrors(prev => ({ ...prev, ssfReceiptFile: 'File must be 10MB or smaller' }));
        return;
      }
      setSsfReceiptFile(selectedFile);
      setErrors(prev => ({ ...prev, ssfReceiptFile: '' }));
    } else {
      setEditData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (editData.welfareFundPaid && !editData.welfareFundPaidDate) {
      nextErrors.welfareFundPaidDate = 'Please fill "Welfare Fund Paid Date" in Insurance & SSF section';
    }
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      if (!record) {
        await create({ candidateId, ...editData });
      } else {
        const dataToSend = { ...editData };
        if (insuranceReceiptFile) dataToSend.insuranceReceiptFile = insuranceReceiptFile;
        if (ssfReceiptFile) dataToSend.ssfReceiptFile = ssfReceiptFile;
        await update(record._id, dataToSend);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {record ? 'Update Insurance & SSF' : 'Add Insurance & SSF'}
            </h3>
            {errors.submit && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{errors.submit}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="border-b pb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Foreign Employment Insurance</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="text" name="insurancePolicyNumber" value={editData.insurancePolicyNumber || ''} onChange={handleChange} placeholder="Policy Number" className="border rounded px-2 py-1 text-sm w-full" />
                    {errors.insurancePolicyNumber && <p className="text-xs text-red-600 mt-1">{errors.insurancePolicyNumber}</p>}
                  </div>
                  <input type="text" name="insuranceCompany" value={editData.insuranceCompany || ''} onChange={handleChange} placeholder="Insurance Company" className="border rounded px-2 py-1 text-sm" />
                  <input type="number" name="insurancePremiumNPR" value={editData.insurancePremiumNPR || ''} onChange={handleChange} placeholder="Premium (NPR)" className="border rounded px-2 py-1 text-sm" />
                  <div>
                    <input type="date" name="insurancePaidDate" value={editData.insurancePaidDate || ''} onChange={handleChange} className="border rounded px-2 py-1 text-sm w-full" />
                    {errors.insurancePaidDate && <p className="text-xs text-red-600 mt-1">{errors.insurancePaidDate}</p>}
                  </div>
                  <input type="number" name="insuranceCoverageYears" value={editData.insuranceCoverageYears || 2} onChange={handleChange} placeholder="Coverage Years" className="border rounded px-2 py-1 text-sm" />
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Upload Insurance Receipt</label>
                  {record?.insurancePaidReceiptUrl && (
                    <a
                      href={resolveFileUrl(record.insurancePaidReceiptUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-1 block text-xs text-primary-600 hover:text-primary-800 underline"
                    >
                      Current file: View uploaded insurance receipt
                    </a>
                  )}
                  <input type="file" name="insuranceReceiptFile" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleChange} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700" />
                  <p className="text-xs text-gray-400 mt-1">Allowed: PDF, JPG, PNG, WEBP (max 10MB)</p>
                  {errors.insuranceReceiptFile && <p className="text-xs text-red-600 mt-1">{errors.insuranceReceiptFile}</p>}
                  {insuranceReceiptFile && <p className="text-xs text-gray-500 mt-1">Selected: {insuranceReceiptFile.name}</p>}
                </div>
              </div>

              <div className="border-b pb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Social Security Fund (SSF)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="text" name="ssfRegistrationNumber" value={editData.ssfRegistrationNumber || ''} onChange={handleChange} placeholder="SSF Registration Number" className="border rounded px-2 py-1 text-sm w-full" />
                    {errors.ssfRegistrationNumber && <p className="text-xs text-red-600 mt-1">{errors.ssfRegistrationNumber}</p>}
                  </div>
                  <input type="number" name="ssfContributionNPR" value={editData.ssfContributionNPR || ''} onChange={handleChange} placeholder="Contribution (NPR)" className="border rounded px-2 py-1 text-sm" />
                  <div>
                    <input type="date" name="ssfPaidDate" value={editData.ssfPaidDate || ''} onChange={handleChange} className="border rounded px-2 py-1 text-sm w-full" />
                    {errors.ssfPaidDate && <p className="text-xs text-red-600 mt-1">{errors.ssfPaidDate}</p>}
                  </div>
                  <input type="text" name="ssfReceiptNumber" value={editData.ssfReceiptNumber || ''} onChange={handleChange} placeholder="Receipt Number" className="border rounded px-2 py-1 text-sm" />
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Upload SSF Receipt</label>
                  {record?.ssfReceiptUrl && (
                    <a
                      href={resolveFileUrl(record.ssfReceiptUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-1 block text-xs text-primary-600 hover:text-primary-800 underline"
                    >
                      Current file: View uploaded SSF receipt
                    </a>
                  )}
                  <input type="file" name="ssfReceiptFile" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleChange} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700" />
                  <p className="text-xs text-gray-400 mt-1">Allowed: PDF, JPG, PNG, WEBP (max 10MB)</p>
                  {errors.ssfReceiptFile && <p className="text-xs text-red-600 mt-1">{errors.ssfReceiptFile}</p>}
                  {ssfReceiptFile && <p className="text-xs text-gray-500 mt-1">Selected: {ssfReceiptFile.name}</p>}
                </div>
              </div>

              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" name="welfareFundPaid" checked={editData.welfareFundPaid || false} onChange={handleChange} className="rounded" />
                  <label className="text-sm text-gray-700">Welfare Fund Paid</label>
                </div>
                {editData.welfareFundPaid && (
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" name="welfareFundAmount" value={editData.welfareFundAmount || ''} onChange={handleChange} placeholder="Amount (NPR)" className="border rounded px-2 py-1 text-sm" />
                    <input type="text" name="welfareFundReceiptNumber" value={editData.welfareFundReceiptNumber || ''} onChange={handleChange} placeholder="Receipt Number" className="border rounded px-2 py-1 text-sm" />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Welfare Fund Paid Date *</label>
                      <input type="date" name="welfareFundPaidDate" value={editData.welfareFundPaidDate || ''} onChange={handleChange} className="border rounded px-2 py-1 text-sm w-full" />
                      {errors.welfareFundPaidDate && <p className="text-xs text-red-600 mt-1">{errors.welfareFundPaidDate}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea name="notes" value={editData.notes || ''} onChange={handleChange} rows={2} className="border rounded px-2 py-1 text-sm w-full" />
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-3">
              <span className="text-red-500">*</span> Required fields only. Other fields are optional.
            </p>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button onClick={handleSubmit} disabled={loading || submitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
              {loading || submitting ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceModal;