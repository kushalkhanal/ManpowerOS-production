import { useState, useEffect } from 'react';
import { useInsuranceSsf } from '../hooks/useInsuranceSsf';
import { INSURANCE_STATUS_COLORS, INSURANCE_STATUS_LABELS, INSURANCE_DEFAULT_PREMIUM, SSF_DEFAULT_CONTRIBUTION } from '../utils/constants';

const InsuranceSsfCard = ({ candidateId, candidateStatus }) => {
  const { getByCandidate, record, loading, create, update } = useInsuranceSsf();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [insuranceReceiptFile, setInsuranceReceiptFile] = useState(null);
  const [ssfReceiptFile, setSsfReceiptFile] = useState(null);

  useEffect(() => {
    if (candidateId) {
      getByCandidate(candidateId);
    }
  }, [candidateId]);

  const canAdd = candidateStatus && ['medical_passed', 'insurance_done', 'visa_applied', 'visa_stamped', 'flight_booked', 'shram_issued', 'on_hold'].includes(candidateStatus);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const hasInsurance = record?.insurancePolicyNumber && record?.insurancePaidDate;
  const hasSSF = record?.ssfRegistrationNumber && record?.ssfPaidDate;
  const hasWelfare = record?.welfareFundPaid === true;

  const completedCount = [hasInsurance, hasSSF, hasWelfare].filter(Boolean).length;

  const handleCreate = async () => {
    try {
      await create({ candidateId });
      getByCandidate(candidateId);
    } catch (err) {
      console.error('Error creating record:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...editData };
      
      if (insuranceReceiptFile) {
        dataToSend.insuranceReceiptFile = insuranceReceiptFile;
      }
      if (ssfReceiptFile) {
        dataToSend.ssfReceiptFile = ssfReceiptFile;
      }
      
      await update(record._id, dataToSend);
      setShowEditModal(false);
      getByCandidate(candidateId);
    } catch (err) {
      console.error('Error updating record:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'insuranceReceiptFile' && files?.length) {
      setInsuranceReceiptFile(files[0]);
    } else if (name === 'ssfReceiptFile' && files?.length) {
      setSsfReceiptFile(files[0]);
    } else {
      setEditData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  useEffect(() => {
    if (record) {
      setEditData({
        insurancePolicyNumber: record.insurancePolicyNumber || '',
        insuranceCompany: record.insuranceCompany || '',
        insurancePremiumNPR: record.insurancePremiumNPR || INSURANCE_DEFAULT_PREMIUM,
        insurancePaidDate: record.insurancePaidDate ? record.insurancePaidDate.split('T')[0] : '',
        insuranceCoverageYears: record.insuranceCoverageYears || 2,
        ssfRegistrationNumber: record.ssfRegistrationNumber || '',
        ssfContributionNPR: record.ssfContributionNPR || SSF_DEFAULT_CONTRIBUTION,
        ssfPaidDate: record.ssfPaidDate ? record.ssfPaidDate.split('T')[0] : '',
        ssfReceiptNumber: record.ssfReceiptNumber || '',
        welfareFundPaid: record.welfareFundPaid || false,
        welfareFundAmount: record.welfareFundAmount || '',
        welfareFundReceiptNumber: record.welfareFundReceiptNumber || '',
        welfareFundPaidDate: record.welfareFundPaidDate ? record.welfareFundPaidDate.split('T')[0] : '',
        notes: record.notes || ''
      });
      setInsuranceReceiptFile(null);
      setSsfReceiptFile(null);
    }
  }, [record]);

  if (loading) {
    return <div className="text-gray-500">Loading insurance/SSF records...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Insurance & SSF</h2>
        {record ? (
          <button
            onClick={() => setShowEditModal(true)}
            className="text-sm text-primary-600 hover:text-primary-900"
          >
            Update
          </button>
        ) : canAdd ? (
          <button
            onClick={handleCreate}
            className="text-sm text-primary-600 hover:text-primary-900"
          >
            + Add Record
          </button>
        ) : null}
      </div>

      {!record ? (
        <p className="text-gray-500 text-sm">
          {canAdd 
            ? 'No insurance/SSF record yet.' 
            : 'Complete orientation to process insurance/SSF.'}
        </p>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{completedCount}/3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  completedCount === 3 ? 'bg-green-600' : 
                  completedCount > 0 ? 'bg-yellow-500' : 'bg-gray-400'
                }`}
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
            <span className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${INSURANCE_STATUS_COLORS[record.overallStatus]}`}>
              {INSURANCE_STATUS_LABELS[record.overallStatus]}
            </span>
          </div>

          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-lg ${hasInsurance ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-lg ${hasInsurance ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasInsurance ? '✓' : '✗'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Foreign Employment Insurance</p>
                  {hasInsurance ? (
                    <p className="text-xs text-gray-500">
                      Policy: {record.insurancePolicyNumber} | NPR {record.insurancePremiumNPR} | Paid: {formatDate(record.insurancePaidDate)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">Not paid</p>
                  )}
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${hasSSF ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-lg ${hasSSF ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasSSF ? '✓' : '✗'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Social Security Fund (SSF)</p>
                  {hasSSF ? (
                    <p className="text-xs text-gray-500">
                      Reg: {record.ssfRegistrationNumber} | NPR {record.ssfContributionNPR} | Paid: {formatDate(record.ssfPaidDate)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">Not paid</p>
                  )}
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${hasWelfare ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-lg ${hasWelfare ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasWelfare ? '✓' : '✗'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Welfare Fund</p>
                  {hasWelfare ? (
                    <p className="text-xs text-gray-500">
                      NPR {record.welfareFundAmount || '-'} | Receipt: {record.welfareFundReceiptNumber || '-'}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">Not paid</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Update Insurance & SSF</h3>
                
                <form onSubmit={handleSave} className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Foreign Employment Insurance</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" name="insurancePolicyNumber" value={editData.insurancePolicyNumber || ''} onChange={handleChange} placeholder="Policy Number" className="border rounded px-2 py-1 text-sm" />
                      <input type="text" name="insuranceCompany" value={editData.insuranceCompany || ''} onChange={handleChange} placeholder="Insurance Company" className="border rounded px-2 py-1 text-sm" />
                      <input type="number" name="insurancePremiumNPR" value={editData.insurancePremiumNPR || ''} onChange={handleChange} placeholder="Premium (NPR)" className="border rounded px-2 py-1 text-sm" />
                      <input type="date" name="insurancePaidDate" value={editData.insurancePaidDate || ''} onChange={handleChange} className="border rounded px-2 py-1 text-sm" />
                      <input type="number" name="insuranceCoverageYears" value={editData.insuranceCoverageYears || 2} onChange={handleChange} placeholder="Coverage Years" className="border rounded px-2 py-1 text-sm" />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">Upload Insurance Receipt</label>
                      <input
                        type="file"
                        name="insuranceReceiptFile"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleChange}
                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700"
                      />
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Social Security Fund (SSF)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" name="ssfRegistrationNumber" value={editData.ssfRegistrationNumber || ''} onChange={handleChange} placeholder="SSF Registration Number" className="border rounded px-2 py-1 text-sm" />
                      <input type="number" name="ssfContributionNPR" value={editData.ssfContributionNPR || ''} onChange={handleChange} placeholder="Contribution (NPR)" className="border rounded px-2 py-1 text-sm" />
                      <input type="date" name="ssfPaidDate" value={editData.ssfPaidDate || ''} onChange={handleChange} className="border rounded px-2 py-1 text-sm" />
                      <input type="text" name="ssfReceiptNumber" value={editData.ssfReceiptNumber || ''} onChange={handleChange} placeholder="Receipt Number" className="border rounded px-2 py-1 text-sm" />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">Upload SSF Receipt</label>
                      <input
                        type="file"
                        name="ssfReceiptFile"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleChange}
                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700"
                      />
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Welfare Fund</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" name="welfareFundPaid" checked={editData.welfareFundPaid || false} onChange={handleChange} className="rounded" />
                      <label className="text-sm text-gray-700">Welfare Fund Paid</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="number" name="welfareFundAmount" value={editData.welfareFundAmount || ''} onChange={handleChange} placeholder="Amount (NPR)" className="border rounded px-2 py-1 text-sm" />
                      <input type="text" name="welfareFundReceiptNumber" value={editData.welfareFundReceiptNumber || ''} onChange={handleChange} placeholder="Receipt Number" className="border rounded px-2 py-1 text-sm" />
                      <input type="date" name="welfareFundPaidDate" value={editData.welfareFundPaidDate || ''} onChange={handleChange} className="border rounded px-2 py-1 text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea name="notes" value={editData.notes || ''} onChange={handleChange} rows={2} className="border rounded px-2 py-1 text-sm w-full" />
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button onClick={handleSave} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm">
                  Save
                </button>
                <button onClick={() => setShowEditModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceSsfCard;