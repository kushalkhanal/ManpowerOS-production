import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { candidatesApi } from '../../../api';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const Row = ({ label, value }) => (
  <div className="grid grid-cols-2 gap-2 border-b border-gray-200 py-1.5">
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-gray-900">{value || '—'}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1.5 rounded mb-3 border-l-4 border-primary">
      {title}
    </h3>
    <div className="px-1">{children}</div>
  </div>
);

const PrintBiodata = () => {
  const { candidateId } = useParams();
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    candidatesApi.printBundle(candidateId)
      .then(r => setBundle(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load data'));
  }, [candidateId]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!bundle) return <div className="p-8 text-gray-400">Loading…</div>;

  const { candidate: c, passport: p, demand: d, medical: m, orientation: o, insurance: ins } = bundle;
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

      {/* Print button */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg shadow hover:bg-primary/90 transition-colors"
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg shadow hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto px-8 py-8 bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-primary">
          <div>
            <h1 className="text-2xl font-bold text-primary">Candidate Bio-Data</h1>
            <p className="text-xs text-gray-400 mt-0.5">Pre-Departure Information Sheet</p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Generated: {printedAt}</p>
            <p className="mt-0.5 font-mono">{c._id?.toString().slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Name banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-gray-900">{c.fullName}</p>
            {c.fullNameNepali && <p className="text-sm text-gray-500 mt-0.5">{c.fullNameNepali}</p>}
          </div>
          <div className="text-right">
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-primary text-white font-semibold">
              {c.status?.replace(/_/g, ' ').toUpperCase()}
            </span>
            <p className="text-xs text-gray-400 mt-1">{c.desiredCountry}</p>
          </div>
        </div>

        {/* Personal */}
        <Section title="Personal Information">
          <Row label="Date of Birth" value={fmt(c.dateOfBirth)} />
          <Row label="Gender" value={cap(c.gender)} />
          <Row label="NID / Citizenship No." value={c.nationalIdNumber} />
          <Row label="Phone" value={c.phone} />
          <Row label="Alternate Phone" value={c.alternatePhone} />
          <Row label="Email" value={c.email} />
          <Row label="Permanent Address" value={[c.permanentMunicipality, c.permanentDistrict, c.permanentProvince].filter(Boolean).join(', ')} />
          <Row label="Ward No." value={c.permanentWardNo} />
          <Row label="Temporary Address" value={c.temporaryAddress} />
        </Section>

        {/* Employment */}
        <Section title="Employment Profile">
          <Row label="Desired Country" value={c.desiredCountry} />
          <Row label="Job Category" value={c.desiredJobCategory} />
          <Row label="Education" value={cap(c.education)} />
          <Row label="Skills" value={c.skills?.join(', ')} />
          <Row label="Languages Known" value={c.languagesKnown?.join(', ')} />
          <Row label="Work Experience" value={c.workExperienceYears != null ? `${c.workExperienceYears} year(s)` : null} />
          <Row label="Previous Country" value={c.previousCountry} />
          <Row label="Referred By" value={c.referredBy} />
          <Row label="Assigned Agent" value={c.agentId?.name || c.agentName} />
        </Section>

        {/* Passport */}
        <Section title="Passport Details">
          <Row label="Passport Number" value={p?.passportNumber || c.passportNumber} />
          <Row label="Issue Date" value={fmt(p?.issueDate)} />
          <Row label="Expiry Date" value={fmt(p?.expiryDate)} />
          <Row label="Issue Place" value={p?.issuePlace} />
          <Row label="MRZ Type" value={p?.mrzType} />
          <Row label="Custody Status" value={p?.custodyStatus?.replace(/_/g, ' ')} />
        </Section>

        {/* Demand */}
        {d && (
          <Section title="Demand / Employer">
            <Row label="Employer" value={d.employerCompanyName} />
            <Row label="Country" value={d.employerCountry} />
            <Row label="Job Category" value={d.jobCategory} />
            <Row label="Contract Period" value={d.contractPeriod} />
            <Row label="Demand Ref." value={d.demandLetterNumber} />
            <Row label="Sponsor Name" value={c.sponsorName} />
          </Section>
        )}

        {/* Government References */}
        <Section title="Government References">
          <Row label="FEIMS Reg. No." value={c.feimsRegistrationNumber} />
          <Row label="FEIMS Status" value={cap(c.feimsApprovalStatus)} />
          <Row label="DoFE File No." value={c.dofeFileNumber} />
          <Row label="Shram Swukriti No." value={c.shramSwikritiNumber} />
          <Row label="Shram Issued" value={fmt(c.shramIssuedDate)} />
          <Row label="Shram Expiry" value={fmt(c.shramExpiryDate)} />
          <Row label="e-Sticker No." value={c.eStickerNumber} />
          <Row label="Visa Number" value={c.visaNumber} />
          <Row label="Visa Received" value={fmt(c.visaReceivedDate)} />
          <Row label="Visa Expiry" value={fmt(c.visaExpiryDate)} />
        </Section>

        {/* Medical */}
        {m && (
          <Section title="Medical Examination">
            <Row label="Medical Center" value={m.medicalCenter} />
            <Row label="Type" value={m.medicalType?.toUpperCase()} />
            <Row label="Scheduled Date" value={fmt(m.scheduledDate)} />
            <Row label="Conducted Date" value={fmt(m.conductedDate)} />
            <Row label="Result" value={cap(m.result)} />
            <Row label="Report Expiry" value={fmt(m.reportExpiryDate)} />
          </Section>
        )}

        {/* Orientation */}
        {o && (
          <Section title="Pre-Departure Orientation (PDOT)">
            <Row label="Training Center" value={o.trainingCenter} />
            <Row label="Batch No." value={o.batchNumber} />
            <Row label="Start Date" value={fmt(o.startDate)} />
            <Row label="End Date" value={fmt(o.endDate)} />
            <Row label="Status" value={cap(o.completionStatus)} />
            <Row label="Certificate No." value={o.certificateNumber} />
          </Section>
        )}

        {/* Insurance */}
        {ins && (
          <Section title="Insurance & SSF">
            <Row label="Insurance Company" value={ins.insuranceCompany} />
            <Row label="Policy Number" value={ins.insurancePolicyNumber} />
            <Row label="SSF Reg. No." value={ins.ssfRegistrationNumber} />
            <Row label="Welfare Fund Paid" value={ins.welfareFundPaid ? 'Yes' : 'No'} />
            <Row label="Overall Status" value={cap(ins.overallStatus)} />
          </Section>
        )}

        {/* Flight */}
        {(c.flightDate || c.flightNumber) && (
          <Section title="Departure Information">
            <Row label="Flight Date" value={fmt(c.flightDate)} />
            <Row label="Flight Number" value={c.flightNumber} />
            <Row label="Airline" value={c.airline} />
            <Row label="Airport Reporting Time" value={c.airportReportingTime} />
          </Section>
        )}

        {/* Signature block */}
        <div className="mt-10 pt-6 border-t border-gray-200 grid grid-cols-3 gap-8">
          {['Candidate Signature', 'Agency Authorized Officer', 'Office Stamp'].map(label => (
            <div key={label} className="text-center">
              <div className="h-14 border-b border-gray-400 mb-2" />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-4">
          Generated by ManpowerOS · Confidential · {printedAt}
        </p>
      </div>
    </>
  );
};

export default PrintBiodata;
