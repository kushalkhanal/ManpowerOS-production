import { useRef } from 'react';

const FEIMSSummaryModal = ({ isOpen, onClose, kanbanData }) => {
  const printRef = useRef(null);

  if (!isOpen || !kanbanData) return null;

  const { candidate, passport } = kanbanData;
  const columns = kanbanData.columns || [];

  const medical = columns.find(c => c.id === 'medical');
  const orientation = columns.find(c => c.id === 'orientation');
  const insurance = columns.find(c => c.id === 'insurance');
  const feims = columns.find(c => c.id === 'feims');
  const visa = columns.find(c => c.id === 'visa');

  const checks = [
    {
      label: 'Medical Clearance (GAMCA/Wafid)',
      done: medical?.status === 'complete',
      detail: medical?.data?.result
        ? `Result: ${medical.data.result.toUpperCase()}${medical.data.conductedDate ? ` | Date: ${new Date(medical.data.conductedDate).toLocaleDateString('en-GB')}` : ''}`
        : 'Not completed',
      fileUrl: medical?.data?.reportFileUrl
    },
    {
      label: 'PDOT Orientation Certificate',
      done: orientation?.status === 'complete',
      detail: orientation?.data?.certificateNumber
        ? `Cert No.: ${orientation.data.certificateNumber}${orientation.data.completionDate ? ` | Date: ${new Date(orientation.data.completionDate).toLocaleDateString('en-GB')}` : ''}`
        : 'Not completed',
      fileUrl: orientation?.data?.certificateFileUrl
    },
    {
      label: 'Insurance & SSF',
      done: insurance?.status === 'complete',
      detail: insurance?.data?.insurancePolicyNumber
        ? `Policy: ${insurance.data.insurancePolicyNumber}`
        : insurance?.status === 'complete' ? 'Completed' : 'Not completed',
      fileUrl: insurance?.data?.insurancePaidReceiptUrl
    },
    {
      label: 'Shram Swikriti / FEIMS',
      done: feims?.status === 'complete',
      detail: [
        candidate.shramSwikritiNumber ? `Shram Swikriti: ${candidate.shramSwikritiNumber}` : null,
        candidate.eStickerNumber ? `E-Sticker: ${candidate.eStickerNumber}` : null,
        candidate.feimsSubmittedAt ? `FO Submitted: ${new Date(candidate.feimsSubmittedAt).toLocaleDateString('en-GB')}` : null
      ].filter(Boolean).join(' | ') || 'Not submitted',
      fileUrl: candidate.feimsFileUrl
    }
  ];

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>FEIMS Summary — ${candidate.fullName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            h2 { font-size: 14px; color: #555; font-weight: normal; margin-top: 0; }
            .meta { font-size: 12px; color: #444; margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 12px; }
            .meta span { margin-right: 20px; }
            .card { border: 1px solid #ccc; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; }
            .card-header { display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 13px; margin-bottom: 4px; }
            .badge-done { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
            .badge-pending { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
            .detail { font-size: 12px; color: #555; }
            .footer { margin-top: 20px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 8px; }
            @media print { body { margin: 12px; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">FEIMS / DoFE Clearance Summary</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5" ref={printRef}>
          <h1 className="text-xl font-bold text-gray-900">{candidate.fullName}</h1>
          <h2 className="text-sm text-gray-500 mt-0.5">
            {candidate.fullNameNepali && <span className="mr-3">{candidate.fullNameNepali}</span>}
            DoFE Clearance Summary
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 pb-3 border-b border-gray-200">
            <div><span className="text-gray-400">Passport No:</span> {passport?.passportNumber || candidate.passportNumber || '—'}</div>
            <div><span className="text-gray-400">Gender:</span> {candidate.gender?.charAt(0).toUpperCase() + candidate.gender?.slice(1) || '—'}</div>
            <div><span className="text-gray-400">Date of Birth:</span> {candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString('en-GB') : '—'}</div>
            <div><span className="text-gray-400">District:</span> {candidate.permanentDistrict || '—'}</div>
            <div><span className="text-gray-400">Country:</span> {candidate.desiredCountry || '—'}</div>
            <div><span className="text-gray-400">Job:</span> {candidate.desiredJobCategory || '—'}</div>
          </div>

          <div className="mt-4 space-y-3">
            {checks.map((check, i) => (
              <div key={i} className={`border rounded-lg p-3 ${check.done ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${check.done ? 'bg-green-500 text-white' : 'bg-red-400 text-white'}`}>
                    {check.done ? '✓' : '✗'}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{check.label}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${check.done ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {check.done ? 'Done' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 ml-7">{check.detail}</p>
                {check.fileUrl && (
                  <a href={check.fileUrl} target="_blank" rel="noopener noreferrer" className="ml-7 text-xs text-primary-600 hover:underline">
                    View document →
                  </a>
                )}
              </div>
            ))}
          </div>

          {(candidate.shramSwikritiNumber || candidate.eStickerNumber || candidate.feimsSubmittedAt) && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-800 mb-2">FEIMS Reference Numbers</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                {candidate.shramSwikritiNumber && (
                  <div><span className="text-gray-400">Shram Swikriti:</span> <strong>{candidate.shramSwikritiNumber}</strong></div>
                )}
                {candidate.eStickerNumber && (
                  <div><span className="text-gray-400">E-Sticker:</span> <strong>{candidate.eStickerNumber}</strong></div>
                )}
                {candidate.feimsSubmittedAt && (
                  <div><span className="text-gray-400">FO Submitted:</span> {new Date(candidate.feimsSubmittedAt).toLocaleDateString('en-GB')}</div>
                )}
                {visa?.data?.visaNumber && (
                  <div><span className="text-gray-400">Visa No.:</span> {visa.data.visaNumber}</div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-400 border-t pt-3">
            Generated: {new Date().toLocaleString('en-GB')} | ManpowerOS
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default FEIMSSummaryModal;
