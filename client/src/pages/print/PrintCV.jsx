import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { candidatesApi, sharedDocumentsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const fmtMonthYear = (d) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }); }
  catch { return null; }
};

const titleCase = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

// ─── Layout primitives ─────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-700 bg-indigo-50 px-3 py-1.5 border-l-4 border-indigo-600 mb-2">
    {children}
  </h2>
);

const Row = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-100">
    <span className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold col-span-1 px-1">{label}</span>
    <span className="text-[12px] text-gray-900 font-medium col-span-2 px-1">{value || '—'}</span>
  </div>
);

const TwoCol = ({ children }) => (
  <div className="grid grid-cols-2 gap-x-6">{children}</div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const PrintCV = () => {
  const { candidateId } = useParams();
  const { agency } = useAuth();
  const [data, setData] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [kanbanRes, docsRes] = await Promise.all([
          candidatesApi.getKanban(candidateId),
          sharedDocumentsApi.getDocuments('candidate', candidateId).catch(() => null),
        ]);
        if (cancelled) return;
        const payload = kanbanRes.data?.data ?? kanbanRes.data;
        setData(payload);
        const docs = docsRes?.data?.data ?? docsRes?.data ?? null;
        setPhotoUrl(docs?.photoFile?.url || null);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load CV data');
      }
    })();
    return () => { cancelled = true; };
  }, [candidateId]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8 text-gray-400">Loading CV…</div>;

  const c = data.candidate || {};
  const p = data.passport  || {};
  const pa = c.physicalAttributes || {};
  const wh = c.workHistory || [];
  const trainings = c.training || [];
  const academics = c.academic || [];
  const langs = c.languagesKnown || [];
  const skills = c.skills || [];
  const nominee = c.nomineeInfo || {};
  const printedAt = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm 14mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: 'Inter', system-ui, sans-serif; background: white; }
      `}</style>

      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-emerald-700 transition-colors"
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

      <div className="max-w-[210mm] mx-auto px-6 py-6 bg-white">

        {/* Header */}
        <div className="flex items-start justify-between mb-5 pb-3 border-b-2 border-indigo-600">
          <div className="flex-1 min-w-0 pr-4">
            {agency?.name && (
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-1">{agency.name}</p>
            )}
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{c.fullName || '—'}</h1>
            {c.fullNameNepali && (
              <p className="text-sm text-gray-600 mt-0.5">{c.fullNameNepali}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Position desired: <span className="font-semibold text-gray-700">{c.desiredJobCategory || skills[0] || '—'}</span>
              {c.desiredCountry && <> · Destination: <span className="font-semibold text-gray-700">{c.desiredCountry}</span></>}
            </p>
          </div>
          <div className="w-[35mm] h-[45mm] border-2 border-gray-300 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Passport photo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-gray-400 text-center px-2">Passport-size<br/>photo</span>
            )}
          </div>
        </div>

        {/* Personal */}
        <SectionTitle>Personal Details</SectionTitle>
        <TwoCol>
          <div>
            <Row label="Date of Birth" value={fmtDate(c.dateOfBirth)} />
            <Row label="Gender" value={titleCase(c.gender)} />
            <Row label="Marital Status" value={titleCase(c.maritalStatus)} />
          </div>
          <div>
            <Row label="Religion" value={c.religion} />
            <Row label="Nationality" value="Nepali" />
            <Row label="Citizenship No." value={c.nationalIdNumber} />
          </div>
        </TwoCol>

        {/* Passport */}
        <div className="mt-3">
          <SectionTitle>Passport Details</SectionTitle>
          <TwoCol>
            <div>
              <Row label="Passport No." value={p.passportNumber || c.passportNumber} />
              <Row label="Issue Date" value={fmtDate(p.issueDate)} />
            </div>
            <div>
              <Row label="Expiry Date" value={fmtDate(p.expiryDate)} />
              <Row label="Issued From" value={p.issuedDistrict} />
            </div>
          </TwoCol>
        </div>

        {/* Contact */}
        <div className="mt-3">
          <SectionTitle>Contact</SectionTitle>
          <Row label="Phone" value={c.phone} />
          <Row
            label="Permanent Address"
            value={[c.permanentMunicipality, `Ward ${c.permanentWardNo || '—'}`, c.permanentDistrict, c.permanentProvince].filter(v => v && v !== 'Ward —').join(', ')}
          />
          {(c.temporaryAddress || c.temporaryDistrict) && (
            <Row
              label="Temporary Address"
              value={[c.temporaryAddress, c.temporaryMunicipality, c.temporaryDistrict, c.temporaryProvince].filter(Boolean).join(', ')}
            />
          )}
        </div>

        {/* Physical attributes (only render if any value present) */}
        {(pa.height || pa.weight || pa.bloodGroup || pa.eyeColor || pa.complexion) && (
          <div className="mt-3">
            <SectionTitle>Physical Attributes</SectionTitle>
            <TwoCol>
              <div>
                <Row label="Height" value={pa.height} />
                <Row label="Weight" value={pa.weight} />
                <Row label="Blood Group" value={pa.bloodGroup} />
              </div>
              <div>
                <Row label="Eye Color" value={pa.eyeColor} />
                <Row label="Complexion" value={pa.complexion} />
              </div>
            </TwoCol>
          </div>
        )}

        {/* Skills & experience */}
        <div className="mt-3">
          <SectionTitle>Skills & Experience</SectionTitle>
          <Row label="Primary Skill" value={skills[0]} />
          {skills.length > 1 && <Row label="Other Skills" value={skills.slice(1).join(', ')} />}
          <Row label="Years of Experience" value={c.workExperienceYears != null ? `${c.workExperienceYears} years` : '—'} />
        </div>

        {/* Work history */}
        {wh.length > 0 && (
          <div className="mt-3">
            <SectionTitle>Work Experience</SectionTitle>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-gray-500 border-b border-gray-200">
                  <th className="text-left py-1.5 px-1 font-semibold">Position</th>
                  <th className="text-left py-1.5 px-1 font-semibold">Company</th>
                  <th className="text-left py-1.5 px-1 font-semibold">Country</th>
                  <th className="text-left py-1.5 px-1 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {wh.map((w, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1 px-1 font-medium">{w.position || '—'}</td>
                    <td className="py-1 px-1">{w.company || '—'}</td>
                    <td className="py-1 px-1">{w.country || '—'}</td>
                    <td className="py-1 px-1 text-gray-600">
                      {fmtMonthYear(w.fromDate) || '—'} – {w.isCurrent ? 'Present' : (fmtMonthYear(w.toDate) || '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Education + training */}
        <div className="mt-3">
          <SectionTitle>Education & Training</SectionTitle>
          <Row label="Highest Qualification" value={c.education ? titleCase(c.education) : '—'} />
          {academics.length > 0 && (
            <Row
              label="Institutions"
              value={academics.map(a => `${a.qualification || ''} · ${a.institutionName || ''}`).filter(s => s.trim() !== '·').join('; ') || '—'}
            />
          )}
          {trainings.length > 0 && (
            <Row
              label="Trainings"
              value={trainings.map(t => `${t.name || ''} (${t.institute || ''})`).filter(s => s !== ' ()').join('; ') || '—'}
            />
          )}
        </div>

        {/* Languages */}
        {langs.length > 0 && (
          <div className="mt-3">
            <SectionTitle>Languages</SectionTitle>
            <Row label="Languages Known" value={langs.join(', ')} />
          </div>
        )}

        {/* Family / Emergency */}
        <div className="mt-3">
          <SectionTitle>Family / Emergency Contact</SectionTitle>
          <TwoCol>
            <div>
              <Row label="Father" value={nominee.fatherName} />
              <Row label="Mother" value={nominee.motherName} />
              <Row label="Spouse" value={nominee.spouseName} />
            </div>
            <div>
              <Row label="Children" value={nominee.noOfChildren ? String(nominee.noOfChildren) : '—'} />
              <Row label="Emergency Contact" value={nominee.emergencyContactPerson} />
              <Row label="Emergency Phone" value={nominee.emergencyContactNumber} />
            </div>
          </TwoCol>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-3 gap-8">
          {['Candidate Signature', 'Agency Officer', 'Agency Stamp'].map(label => (
            <div key={label} className="text-center">
              <div className="h-12 border-b border-gray-400 mb-1.5" />
              <p className="text-[10px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-gray-300 text-center mt-3">
          {agency?.name ? `${agency.name} · ` : ''}Curriculum Vitae · Generated {printedAt}
        </p>
      </div>
    </>
  );
};

export default PrintCV;
