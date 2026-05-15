import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { feimsApi } from '../../../api';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Field = ({ label, value, highlight }) => (
  <div className={`grid grid-cols-2 gap-2 border-b border-gray-100 py-1.5 ${highlight ? 'bg-yellow-50' : ''}`}>
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">{label}</span>
    <span className="text-sm text-gray-900 font-medium px-1">{value || '—'}</span>
  </div>
);

const Section = ({ title, color = 'blue', children }) => {
  const colors = {
    blue:   'bg-blue-50 border-blue-300 text-blue-800',
    green:  'bg-green-50 border-green-300 text-green-800',
    purple: 'bg-purple-50 border-purple-300 text-purple-800',
    orange: 'bg-orange-50 border-orange-300 text-orange-800',
  };
  return (
    <div className="mb-5">
      <h3 className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded border-l-4 mb-2 ${colors[color]}`}>
        {title}
      </h3>
      <div className="px-1">{children}</div>
    </div>
  );
};

const CheckItem = ({ label, done }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${done ? 'text-green-700' : 'text-red-600'}`}>
    <span className="text-base">{done ? '✓' : '✗'}</span>
    <span>{label}</span>
  </div>
);

const PrintFeimsPacket = () => {
  const { candidateId } = useParams();
  const [packet, setPacket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    feimsApi.getPacket(candidateId)
      .then(r => setPacket(r.data?.data ?? r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load FEIMS packet'));
  }, [candidateId]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!packet) return <div className="p-8 text-gray-400">Loading…</div>;

  const { candidate: c, feimsData: f, documentChecklist = [], missingFields = [], submissionReady } = packet;
  const printedAt = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: 'Inter', system-ui, sans-serif; background: white; }
      `}</style>

      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg shadow hover:bg-primary/90 transition-colors">
          Print / Save PDF
        </button>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg shadow hover:bg-gray-200 transition-colors">
          Close
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto px-8 py-8 bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-indigo-600">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">FEIMS Submission Packet</h1>
            <p className="text-xs text-gray-400 mt-0.5">Foreign Employment Information Management System</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Generated: {printedAt}</p>
            <div className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold ${submissionReady ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {submissionReady ? 'READY FOR SUBMISSION' : 'NOT READY'}
            </div>
          </div>
        </div>

        {/* Candidate banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-5 py-3 mb-6 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900">{c?.fullName}</p>
            <p className="text-xs text-gray-500">{c?.desiredCountry} · {c?.desiredJobCategory}</p>
          </div>
          <p className="text-xs text-gray-400 font-mono">{c?.nationalIdNumber}</p>
        </div>

        {/* Missing fields warning */}
        {missingFields.length > 0 && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-bold text-red-700 mb-2">Missing Required Fields</p>
            <ul className="list-disc list-inside space-y-0.5">
              {missingFields.map(f => (
                <li key={f} className="text-xs text-red-600">{f}</li>
              ))}
            </ul>
          </div>
        )}

        {/* FEIMS registration data */}
        {f && (
          <>
            <Section title="FEIMS Registration Data" color="blue">
              <Field label="Registration No." value={f.feimsRegistrationNumber} />
              <Field label="Approval Status" value={f.feimsApprovalStatus} />
              <Field label="DoFE File No." value={f.dofeFileNumber} />
              <Field label="Submitted At" value={fmt(f.feimsSubmittedAt)} />
            </Section>

            <Section title="Shram Swukriti (Labour Permit)" color="green">
              <Field label="Shram Swukriti No." value={f.shramSwikritiNumber} />
              <Field label="Shram Issued Date" value={fmt(f.shramIssuedDate)} />
              <Field label="Shram Expiry Date" value={fmt(f.shramExpiryDate)} />
              <Field label="e-Sticker No." value={f.eStickerNumber} />
            </Section>

            <Section title="Employer / Demand Details" color="purple">
              <Field label="Employer" value={f.employerCompanyName} />
              <Field label="Country" value={f.employerCountry} />
              <Field label="Demand Letter No." value={f.demandLetterNumber} />
              <Field label="Visa Number" value={f.visaNumber} />
              <Field label="Visa Received" value={fmt(f.visaReceivedDate)} />
              <Field label="Visa Expiry" value={fmt(f.visaExpiryDate)} />
            </Section>

            {(f.vlnNumber || f.plksNumber) && (
              <Section title="Malaysia Details (VLN / PLKS)" color="orange">
                <Field label="VLN Number" value={f.vlnNumber} />
                <Field label="VLN Received" value={fmt(f.vlnReceivedDate)} />
                <Field label="VLN Expiry" value={fmt(f.vlnExpiryDate)} />
                <Field label="PLKS Number" value={f.plksNumber} />
                <Field label="PLKS Issued" value={fmt(f.plksIssuedDate)} />
                <Field label="PLKS Expiry" value={fmt(f.plksExpiryDate)} />
                <Field label="FWCMS Calling Letter" value={f.fwcmsCallingLetterNumber} />
                <Field label="FOMEMA Ref." value={f.fomemaReferenceNumber} />
                <Field label="Bestinet Biometric Ref." value={f.bestinetBiometricRef} />
              </Section>
            )}
          </>
        )}

        {/* Document checklist */}
        {documentChecklist.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 bg-gray-50 px-3 py-1.5 rounded border-l-4 border-gray-400 mb-2">
              Document Checklist
            </h3>
            <div className="grid grid-cols-2 gap-x-4">
              {documentChecklist.map(item => (
                <CheckItem key={item.key || item.label} label={item.label} done={item.done} />
              ))}
            </div>
          </div>
        )}

        {/* Flight info */}
        {(c?.flightDate || c?.flightNumber) && (
          <Section title="Departure Details" color="green">
            <Field label="Flight Date" value={fmt(c.flightDate)} />
            <Field label="Flight Number" value={c.flightNumber} />
            <Field label="Airline" value={c.airline} />
            <Field label="Airport Reporting Time" value={c.airportReportingTime} />
          </Section>
        )}

        {/* Signature block */}
        <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-3 gap-8">
          {['Submitted By', 'Agency Officer', 'DoFE Stamp'].map(label => (
            <div key={label} className="text-center">
              <div className="h-14 border-b border-gray-400 mb-2" />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-4">
          ManpowerOS · FEIMS Submission Packet · {printedAt}
        </p>
      </div>
    </>
  );
};

export default PrintFeimsPacket;
