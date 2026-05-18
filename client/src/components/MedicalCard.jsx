import { useState, useEffect } from 'react';
import { useMedical } from '../hooks/useMedical';
import { RESULT_COLORS, RESULT_LABELS, MEDICAL_TYPE_LABELS } from '../utils/medicalConstants';
import MedicalModal from './MedicalModal';

const MedicalCard = ({ candidateId, candidateStatus }) => {
  const { getMedicalByCandidate, medicals, loading } = useMedical();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedMedical, setSelectedMedical] = useState(null);

  useEffect(() => {
    if (candidateId) {
      getMedicalByCandidate(candidateId);
    }
  }, [candidateId]);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const isExpiryWarning = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    return days !== null && days <= 30 && days > 0;
  };

  const isExpiryExpired = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    return days !== null && days <= 0;
  };

  const handleUpdateClick = (medical) => {
    setSelectedMedical(medical);
    setShowUpdateModal(true);
  };

  const handleScheduleNew = () => {
    setSelectedMedical(null);
    setShowUpdateModal(true);
  };

  const handleSuccess = () => {
    getMedicalByCandidate(candidateId);
  };

  if (loading) {
    return <div className="text-gray-500">Loading medical records...</div>;
  }

  const latestMedical = medicals[0];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Medical Records</h2>
        <button
          onClick={handleScheduleNew}
          className="text-sm text-primary-600 hover:text-primary-900"
        >
          + Schedule New
        </button>
      </div>

      {medicals.length === 0 ? (
        <p className="text-gray-500 text-sm">No medical records yet. Schedule the first medical examination.</p>
      ) : (
        <div className="space-y-4">
          {medicals.map((medical) => {
            const daysUntilExpiry = getDaysUntilExpiry(medical.reportExpiryDate);
            const showWarning = isExpiryWarning(medical.reportExpiryDate) && candidateStatus !== 'departed';
            const showExpired = isExpiryExpired(medical.reportExpiryDate) && candidateStatus !== 'departed';

            return (
              <div key={medical._id} className="border border-gray-200 rounded-lg p-4">
                {showWarning && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">
                      ⚠️ Report expires in {daysUntilExpiry} days
                    </p>
                  </div>
                )}
                {showExpired && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md">
                    <p className="text-sm text-red-800">
                      ⚠️ Report has expired - requires re-medical
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {MEDICAL_TYPE_LABELS[medical.medicalType] || medical.medicalType}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${RESULT_COLORS[medical.result]}`}>
                        {RESULT_LABELS[medical.result]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      {medical.medicalCenter || 'No center specified'}
                    </p>
                    {medical.amount != null && (
                      <p className="text-sm text-gray-500">Amount: {medical.amount}</p>
                    )}
                    {medical.conductedDate && (
                      <p className="text-sm text-gray-500">Check Up Date: {formatDate(medical.conductedDate)}</p>
                    )}
                    {medical.examinedBy && (
                      <p className="text-sm text-gray-500">Examined By: {medical.examinedBy}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleUpdateClick(medical)}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    Update
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUpdateModal && (
        <MedicalModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedMedical(null);
          }}
          medical={selectedMedical}
          candidateId={candidateId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default MedicalCard;