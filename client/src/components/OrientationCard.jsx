import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useOrientation } from '../hooks/useOrientation';
import { orientationApi } from '../api/orientation.api.js';
import { ORIENTATION_STATUS_COLORS, ORIENTATION_STATUS_LABELS, ORIENTATION_FEE } from '../utils/constants';
import OrientationModal from './OrientationModal';
import { ConfirmDialog } from './ui';

const OrientationCard = ({ candidateId, candidateStatus }) => {
  const { getOrientationsByCandidate, orientations, loading, createOrientation } = useOrientation();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrientation, setSelectedOrientation] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    trainingCenter: '',
    trainingCenterCode: '',
    batchNumber: '',
    startDate: '',
    notes: ''
  });
  const [scheduleErrors, setScheduleErrors] = useState({});
  const [orientationToDeleteCert, setOrientationToDeleteCert] = useState(null);

  useEffect(() => {
    if (candidateId) {
      getOrientationsByCandidate(candidateId);
    }
  }, [candidateId]);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const canSchedule = candidateStatus && ['medical_passed', 'on_hold'].includes(candidateStatus);

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleData(prev => ({ ...prev, [name]: value }));
    if (scheduleErrors[name]) setScheduleErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduleErrors({});

    if (!scheduleData.startDate) {
      setScheduleErrors({ startDate: 'Start date is required' });
      return;
    }

    try {
      await createOrientation({
        candidateId,
        ...scheduleData
      });
      setShowScheduleModal(false);
      setScheduleData({
        trainingCenter: '',
        trainingCenterCode: '',
        batchNumber: '',
        startDate: '',
        notes: ''
      });
      getOrientationsByCandidate(candidateId);
    } catch (err) {
      setScheduleErrors({ submit: err.message });
    }
  };

  const handleMarkComplete = (orientation) => {
    setSelectedOrientation(orientation);
    setShowCompleteModal(true);
  };

  const handleCompleteSuccess = () => {
    getOrientationsByCandidate(candidateId);
  };

  const handleUploadCertificate = async (orientationId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF and images allowed');
      return;
    }

    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      await orientationApi.uploadCertificate(orientationId, formData);
      toast.success('Certificate uploaded successfully');
      getOrientationsByCandidate(candidateId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload certificate');
    } finally {
      setUploadingCert(false);
    }
  };

  const handleDeleteCertificate = async () => {
    if (!orientationToDeleteCert) return;
    try {
      await orientationApi.deleteCertificate(orientationToDeleteCert);
      toast.success('Certificate deleted');
      getOrientationsByCandidate(candidateId);
      setOrientationToDeleteCert(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete certificate');
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading orientation records...</div>;
  }

  const latestOrientation = orientations[0];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">PDOT Orientation</h2>
        {canSchedule && !latestOrientation && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="text-sm text-primary-600 hover:text-primary-900"
          >
            + Schedule Orientation
          </button>
        )}
      </div>

      {orientations.length === 0 ? (
        <p className="text-gray-500 text-sm">
          {canSchedule 
            ? 'No orientation scheduled yet. Schedule PDOT training.' 
            : 'Complete medical clearance to schedule orientation.'}
        </p>
      ) : (
        <div className="space-y-4">
          {orientations.map((orientation) => {
            const hasCertificate = !!orientation.certificateNumber;
            
            return (
              <div key={orientation._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        Batch: {orientation.batchNumber || '-'}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ORIENTATION_STATUS_COLORS[orientation.completionStatus]}`}>
                        {ORIENTATION_STATUS_LABELS[orientation.completionStatus]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {orientation.trainingCenter || 'No center specified'}
                      {orientation.trainingCenterCode && ` (${orientation.trainingCenterCode})`}
                    </p>
                    <div className="text-xs text-gray-400 space-x-4">
                      <span>Start: {formatDate(orientation.startDate)}</span>
                      {orientation.endDate && <span>End: {formatDate(orientation.endDate)}</span>}
                    </div>
                    {hasCertificate && (
                      <div className="text-sm text-gray-600 mt-1">
                        Certificate: <span className="font-mono">{orientation.certificateNumber}</span>
                        {orientation.certificateIssuedDate && (
                          <span className="text-gray-400"> (Issued: {formatDate(orientation.certificateIssuedDate)})</span>
                        )}
                      </div>
                    )}
                    {!hasCertificate && orientation.completionStatus === 'completed' && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-700">
                          ⚠️ Certificate number missing - required for FEIMS submission
                        </p>
                      </div>
                    )}
                    
                    {/* Certificate Upload Section */}
                    <div className="mt-3 p-3 border border-gray-200 rounded-md">
                      <p className="text-sm font-medium text-gray-700 mb-2">Certificate Document</p>
                      {orientation.certificateFileUrl ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-green-600 text-sm">✓ Uploaded</span>
                            {orientation.certificateUploadedAt && (
                              <p className="text-xs text-gray-500">
                                {formatDate(orientation.certificateUploadedAt)}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={orientation.certificateFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-emerald-600 hover:text-emerald-700"
                            >
                              View
                            </a>
                            <button
                              onClick={() => setOrientationToDeleteCert(orientation._id)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Not uploaded yet</p>
                          <label className="inline-flex items-center px-3 py-2 text-sm bg-emerald-600 text-white rounded-md cursor-pointer hover:bg-emerald-700">
                            {uploadingCert ? 'Uploading...' : 'Upload Certificate'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              className="hidden"
                              onChange={(e) => handleUploadCertificate(orientation._id, e)}
                              disabled={uploadingCert}
                            />
                          </label>
                          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 5MB)</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-1">
                      Fee: NPR {orientation.feeAmount || ORIENTATION_FEE}
                      {orientation.feePaidAt ? ` (Paid: ${formatDate(orientation.feePaidAt)})` : ' (Unpaid)'}
                      {orientation.feeReceiptNumber && ` - Receipt: ${orientation.feeReceiptNumber}`}
                    </div>
                  </div>
                  {orientation.completionStatus === 'scheduled' && (
                    <button
                      onClick={() => handleMarkComplete(orientation)}
                      className="text-sm text-green-600 hover:text-green-900"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowScheduleModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Schedule PDOT Orientation</h3>
                {scheduleErrors.submit && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{scheduleErrors.submit}</div>
                )}
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Training Center</label>
                    <input
                      type="text"
                      name="trainingCenter"
                      value={scheduleData.trainingCenter}
                      onChange={handleScheduleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Center Code</label>
                    <input
                      type="text"
                      name="trainingCenterCode"
                      value={scheduleData.trainingCenterCode}
                      onChange={handleScheduleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={scheduleData.batchNumber}
                      onChange={handleScheduleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={scheduleData.startDate}
                      onChange={handleScheduleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    {scheduleErrors.startDate && <p className="text-red-500 text-xs mt-1">{scheduleErrors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      name="notes"
                      value={scheduleData.notes}
                      onChange={handleScheduleChange}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleScheduleSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Schedule
                </button>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && selectedOrientation && (
        <OrientationModal
          isOpen={showCompleteModal}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedOrientation(null);
          }}
          orientation={selectedOrientation}
          candidateId={candidateId}
          onSuccess={handleCompleteSuccess}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(orientationToDeleteCert)}
        title="Delete Certificate"
        message="Are you sure you want to delete this orientation certificate?"
        confirmLabel="Delete Certificate"
        confirmVariant="danger"
        onCancel={() => setOrientationToDeleteCert(null)}
        onConfirm={handleDeleteCertificate}
      />
    </div>
  );
};

export default OrientationCard;