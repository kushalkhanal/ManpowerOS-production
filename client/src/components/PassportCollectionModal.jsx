const PassportCollectionModal = ({ isOpen, onClose, passport, candidateId, onSuccess }) => {
  if (!isOpen) return null;

  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_SERVER_URL || ''}${url}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Passport Details</h3>

            {passport ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Passport Number</span>
                    <span className="font-semibold text-gray-900">{passport.passportNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Full Name</span>
                    <span className="font-medium text-gray-800">{passport.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Date of Birth</span>
                    <span className="text-gray-800">{passport.dateOfBirthBS || (passport.dateOfBirth ? new Date(passport.dateOfBirth).toLocaleDateString('en-GB') : '—')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Gender</span>
                    <span className="text-gray-800 capitalize">{passport.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Issue Date</span>
                    <span className="text-gray-800">{passport.issueDateBS || (passport.issueDate ? new Date(passport.issueDate).toLocaleDateString('en-GB') : '—')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Expiry Date</span>
                    <span className={`font-medium ${passport.expiryDate && new Date(passport.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-800'}`}>
                      {passport.expiryDateBS || (passport.expiryDate ? new Date(passport.expiryDate).toLocaleDateString('en-GB') : '—')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Issued District</span>
                    <span className="text-gray-800">{passport.issuedDistrict || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Custody Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      passport.custodyStatus === 'with_agency' ? 'bg-green-100 text-green-700' :
                      passport.custodyStatus === 'submitted_embassy' ? 'bg-amber-100 text-amber-700' :
                      passport.custodyStatus === 'returned_to_candidate' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {passport.custodyStatus?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Collected Date</span>
                    <span className="text-gray-800">{passport.collectedAtBS || (passport.collectedAt ? new Date(passport.collectedAt).toLocaleDateString('en-GB') : '—')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Validity</span>
                    <span className="text-gray-800">{passport.validityMonths ? `${passport.validityMonths} months remaining` : '—'}</span>
                  </div>
                </div>

                {passport.scannedImageUrl && (
                  <div className="pt-2 border-t">
                    <a
                      href={resolveUrl(passport.scannedImageUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-800 underline flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View scanned passport
                    </a>
                  </div>
                )}

                {passport.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-gray-700">
                    <span className="text-xs text-gray-500 block mb-1">Notes</span>
                    {passport.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No passport linked to this candidate.</p>
                <p className="text-xs mt-1">Please allocate a passport from the Passport Pool first.</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportCollectionModal;
