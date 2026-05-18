import { useState, useEffect } from 'react';
import { useVisa } from '../hooks/useVisa';
import VisaApplicationModal from './VisaApplicationModal';

const STATUS_COLORS = {
  not_started:          'bg-gray-100 text-gray-700',
  calling_visa_pending: 'bg-amber-100 text-amber-700',
  appointed:            'bg-blue-100 text-blue-700',
  submitted:            'bg-indigo-100 text-indigo-700',
  stamped:              'bg-green-100 text-green-800',
  rejected:             'bg-red-100 text-red-800',
  cancelled:            'bg-gray-200 text-gray-600'
};

const STATUS_LABELS = {
  not_started:          'Not Started',
  calling_visa_pending: 'Calling Visa Pending',
  appointed:            'Appointed',
  submitted:            'Submitted',
  stamped:              'Stamped',
  rejected:             'Rejected',
  cancelled:            'Cancelled'
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const VisaApplicationCard = ({ candidateId }) => {
  const { visaApplications, loading, getByCandidate } = useVisa();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (candidateId) getByCandidate(candidateId);
  }, [candidateId]);

  const handleSuccess = () => getByCandidate(candidateId);

  if (loading) return <div className="bg-white shadow rounded-lg p-6 text-sm text-gray-500">Loading visa applications...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Visa & Embassy</h2>
        <button
          onClick={() => { setSelected(null); setShowModal(true); }}
          className="text-sm text-primary-600 hover:text-primary-900"
        >
          + New Application
        </button>
      </div>

      {visaApplications.length === 0 ? (
        <p className="text-sm text-gray-500">No visa applications yet.</p>
      ) : (
        <div className="space-y-3">
          {visaApplications.map((app) => (
            <div key={app._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {app.country || 'Country N/A'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[app.status]}`}>
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                  </div>

                  {app.embassyName && (
                    <p className="text-sm text-gray-500">{app.embassyName}{app.embassyCity ? `, ${app.embassyCity}` : ''}</p>
                  )}

                  <div className="text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-0.5">
                    {app.callingVisaNumber && <span>Calling Visa: {app.callingVisaNumber}</span>}
                    {app.applicationRef && <span>Ref: {app.applicationRef}</span>}
                    {app.appointmentDate && <span>Appointment: {fmt(app.appointmentDate)}</span>}
                    {app.submittedDate && <span>Submitted: {fmt(app.submittedDate)}</span>}
                  </div>

                  {app.visaNumber && (
                    <div className="text-xs text-gray-600 flex flex-wrap gap-x-4">
                      <span>Visa#: {app.visaNumber}</span>
                      {app.visaIssuedDate && <span>Issued: {fmt(app.visaIssuedDate)}</span>}
                      {app.visaExpiryDate && <span>Expires: {fmt(app.visaExpiryDate)}</span>}
                    </div>
                  )}

                  {app.eStickerNumber && (
                    <p className="text-xs text-gray-600">E-Sticker: {app.eStickerNumber} — Issued: {fmt(app.eStickerIssuedDate)}</p>
                  )}

                  {app.rejectionReason && (
                    <p className="text-xs text-red-600">Rejected: {app.rejectionReason}</p>
                  )}

                  <div className="flex gap-3 mt-1">
                    {app.visaFileUrl && (
                      <a href={app.visaFileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:underline">View visa →</a>
                    )}
                    {app.eStickerFileUrl && (
                      <a href={app.eStickerFileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:underline">View e-sticker →</a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setSelected(app); setShowModal(true); }}
                  className="text-sm text-primary-600 hover:text-primary-900 shrink-0 ml-3"
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <VisaApplicationModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setSelected(null); }}
          record={selected}
          candidateId={candidateId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default VisaApplicationCard;
