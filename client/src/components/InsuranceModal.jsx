import { useState, useEffect } from 'react';
import { useInsuranceSsf } from '../hooks/useInsuranceSsf';
import { isValidFileSize, isValidFileType } from '../utils/validation';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EMPTY_FORM = {
  insuranceCompany: '',
  insuranceBranch: '',
  insurancePolicyName: '',
  insurancePolicyNumber: '',
  insurancePremiumNPR: '',
  insurancePaidDate: '',
  insuranceExpiryDate: '',
  insuranceCoverageYears: '',
  ssfRegistrationNumber: '',
  ssfContributionNPR: '',
  ssfPaidDate: '',
  ssfReceiptNumber: '',
  welfareFundPaid: false,
  welfareFundAmount: '',
  welfareFundReceiptNumber: '',
  welfareFundPaidDate: '',
  notes: ''
};

const resolveFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_SERVER_URL || ''}${url}`;
};

const DocIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SectionHeader = ({ title }) => (
  <div className="relative mb-3">
    <div className="absolute -left-[22px] top-0.5 w-4 h-4 rounded-full border-2 border-gray-300 bg-white" />
    <h4 className="text-sm font-semibold text-cyan-500">{title}</h4>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = "block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500";

const InsuranceModal = ({ isOpen, onClose, candidateId, onSuccess }) => {
  const { getByCandidate, record, loading, create, update } = useInsuranceSsf();
  const [editData, setEditData] = useState(EMPTY_FORM);
  const [insuranceReceiptFile, setInsuranceReceiptFile] = useState(null);
  const [ssfReceiptFile, setSsfReceiptFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (candidateId && isOpen) {
      getByCandidate(candidateId);
    }
  }, [candidateId, isOpen]);

  useEffect(() => {
    if (record) {
      setEditData({
        insuranceCompany: record.insuranceCompany || '',
        insuranceBranch: record.insuranceBranch || '',
        insurancePolicyName: record.insurancePolicyName || '',
        insurancePolicyNumber: record.insurancePolicyNumber || '',
        insurancePremiumNPR: record.insurancePremiumNPR || '',
        insurancePaidDate: record.insurancePaidDate ? record.insurancePaidDate.split('T')[0] : '',
        insuranceExpiryDate: record.insuranceExpiryDate ? record.insuranceExpiryDate.split('T')[0] : '',
        insuranceCoverageYears: record.insuranceCoverageYears || '',
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
      setEditData(EMPTY_FORM);
    }
    setInsuranceReceiptFile(null);
    setSsfReceiptFile(null);
    setErrors({});
  }, [record, isOpen]);

  const handleFileChange = (name, file, setFile, errKey) => {
    if (!isValidFileType(file, ALLOWED_FILE_TYPES)) {
      setErrors(prev => ({ ...prev, [errKey]: 'Only JPG, PNG, WEBP, and PDF are allowed' }));
      return;
    }
    if (!isValidFileSize(file, MAX_FILE_SIZE)) {
      setErrors(prev => ({ ...prev, [errKey]: 'File must be 10MB or smaller' }));
      return;
    }
    setFile(file);
    setErrors(prev => ({ ...prev, [errKey]: '' }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'insuranceReceiptFile' && files?.length) {
      handleFileChange(name, files[0], setInsuranceReceiptFile, 'insuranceReceiptFile');
    } else if (name === 'ssfReceiptFile' && files?.length) {
      handleFileChange(name, files[0], setSsfReceiptFile, 'ssfReceiptFile');
    } else {
      setEditData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const dataToSend = { ...editData };
      if (insuranceReceiptFile) dataToSend.insuranceReceiptFile = insuranceReceiptFile;
      if (ssfReceiptFile) dataToSend.ssfReceiptFile = ssfReceiptFile;

      if (!record) {
        await create({ candidateId, ...dataToSend });
      } else {
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

  const hasInsuranceDoc = !!record?.insurancePaidReceiptUrl;
  const hasSsfDoc = !!record?.ssfReceiptUrl;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg text-left shadow-xl w-full sm:max-w-3xl sm:my-8">
          {/* Header */}
          <div className="px-6 pt-6 pb-2 border-b border-gray-100">
            <h3 className="text-2xl font-light text-gray-500">Insurance Details</h3>
          </div>

          {errors.submit && (
            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{errors.submit}</div>
          )}

          {/* Body */}
          <div className="px-6 py-4 flex gap-8 max-h-[65vh] overflow-y-auto">
            {/* Left column — Company + Policy + SSF + Welfare */}
            <div className="flex-1 min-w-0">
              <div className="relative pl-7">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />

                {/* Company Information */}
                <section className="mb-7">
                  <SectionHeader title="Company Information" />
                  <div className="space-y-3">
                    <Field label="Company Name">
                      <input
                        type="text"
                        name="insuranceCompany"
                        value={editData.insuranceCompany}
                        onChange={handleChange}
                        placeholder="e.g. IME Life Insurance Company Limited"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Branch Name">
                      <input
                        type="text"
                        name="insuranceBranch"
                        value={editData.insuranceBranch}
                        onChange={handleChange}
                        placeholder="e.g. Main Branch"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </section>

                {/* Policy Information */}
                <section className="mb-7">
                  <SectionHeader title="Policy Information" />
                  <div className="space-y-3">
                    <Field label="Policy Name">
                      <input
                        type="text"
                        name="insurancePolicyName"
                        value={editData.insurancePolicyName}
                        onChange={handleChange}
                        placeholder="e.g. Foreign Employment Insurance"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Policy No">
                      <input
                        type="text"
                        name="insurancePolicyNumber"
                        value={editData.insurancePolicyNumber}
                        onChange={handleChange}
                        placeholder="e.g. FE0108283040262"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Policy Amount (NPR)">
                      <input
                        type="number"
                        name="insurancePremiumNPR"
                        value={editData.insurancePremiumNPR}
                        onChange={handleChange}
                        placeholder="e.g. 3708"
                        className={inputCls}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Policy Start Date">
                        <input
                          type="date"
                          name="insurancePaidDate"
                          value={editData.insurancePaidDate}
                          onChange={handleChange}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Policy End Date">
                        <input
                          type="date"
                          name="insuranceExpiryDate"
                          value={editData.insuranceExpiryDate}
                          onChange={handleChange}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <Field label="Policy Tenure (Years)">
                      <input
                        type="number"
                        step="0.5"
                        name="insuranceCoverageYears"
                        value={editData.insuranceCoverageYears}
                        onChange={handleChange}
                        placeholder="e.g. 2.5"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </section>

                {/* SSF */}
                <section className="mb-7">
                  <SectionHeader title="Social Security Fund (SSF)" />
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="SSF Registration No">
                        <input
                          type="text"
                          name="ssfRegistrationNumber"
                          value={editData.ssfRegistrationNumber}
                          onChange={handleChange}
                          placeholder="Registration Number"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Contribution (NPR)">
                        <input
                          type="number"
                          name="ssfContributionNPR"
                          value={editData.ssfContributionNPR}
                          onChange={handleChange}
                          placeholder="e.g. 2595"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="SSF Paid Date">
                        <input
                          type="date"
                          name="ssfPaidDate"
                          value={editData.ssfPaidDate}
                          onChange={handleChange}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Receipt Number">
                        <input
                          type="text"
                          name="ssfReceiptNumber"
                          value={editData.ssfReceiptNumber}
                          onChange={handleChange}
                          placeholder="Receipt Number"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                {/* Welfare Fund */}
                <section>
                  <div className="relative mb-3">
                    <div className="absolute -left-[22px] top-0.5 w-4 h-4 rounded-full border-2 border-gray-300 bg-white" />
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-semibold text-cyan-500">Welfare Fund</h4>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          name="welfareFundPaid"
                          checked={editData.welfareFundPaid}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-cyan-600"
                        />
                        <span className="text-xs text-gray-600">Paid</span>
                      </label>
                    </div>
                  </div>
                  {editData.welfareFundPaid && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Amount (NPR)">
                          <input
                            type="number"
                            name="welfareFundAmount"
                            value={editData.welfareFundAmount}
                            onChange={handleChange}
                            placeholder="Amount"
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Receipt Number">
                          <input
                            type="text"
                            name="welfareFundReceiptNumber"
                            value={editData.welfareFundReceiptNumber}
                            onChange={handleChange}
                            placeholder="Receipt Number"
                            className={inputCls}
                          />
                        </Field>
                      </div>
                      <Field label="Paid Date">
                        <input
                          type="date"
                          name="welfareFundPaidDate"
                          value={editData.welfareFundPaidDate}
                          onChange={handleChange}
                          className={inputCls}
                        />
                        {errors.welfareFundPaidDate && (
                          <p className="text-xs text-red-600 mt-1">{errors.welfareFundPaidDate}</p>
                        )}
                      </Field>
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Right column — Documents */}
            <div className="w-52 flex-shrink-0">
              <div className="relative pl-7">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />

                <section>
                  <SectionHeader title="Documents" />
                  <div className="space-y-5">
                    {/* Insurance Receipt */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Insurance Receipt</p>
                      {hasInsuranceDoc ? (
                        <a
                          href={resolveFileUrl(record.insurancePaidReceiptUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800 underline mb-1"
                        >
                          <DocIcon /> View document
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400 mb-1">No document found</p>
                      )}
                      <input
                        type="file"
                        name="insuranceReceiptFile"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleChange}
                        className="block w-full text-xs text-gray-500 file:mr-1 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                      />
                      {errors.insuranceReceiptFile && (
                        <p className="text-xs text-red-600 mt-1">{errors.insuranceReceiptFile}</p>
                      )}
                      {insuranceReceiptFile && (
                        <p className="text-xs text-green-600 mt-1 truncate">{insuranceReceiptFile.name}</p>
                      )}
                    </div>

                    {/* SSF Receipt */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">SSF Receipt</p>
                      {hasSsfDoc ? (
                        <a
                          href={resolveFileUrl(record.ssfReceiptUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800 underline mb-1"
                        >
                          <DocIcon /> View document
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400 mb-1">No document found</p>
                      )}
                      <input
                        type="file"
                        name="ssfReceiptFile"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleChange}
                        className="block w-full text-xs text-gray-500 file:mr-1 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                      />
                      {errors.ssfReceiptFile && (
                        <p className="text-xs text-red-600 mt-1">{errors.ssfReceiptFile}</p>
                      )}
                      {ssfReceiptFile && (
                        <p className="text-xs text-green-600 mt-1 truncate">{ssfReceiptFile.name}</p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Notes</p>
                      <textarea
                        name="notes"
                        value={editData.notes}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Additional notes..."
                        className="block w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse gap-2 rounded-b-lg border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={loading || submitting}
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading || submitting ? 'Saving...' : record ? 'Update' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceModal;
