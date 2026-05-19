import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { personsApi, passportApi } from '../../../api';

// Printable A4 detail sourced from the Passport Pool. Layout matches the
// agency reference: cyan section headers in a two-column grid. Sections
// where every field is empty are dropped; sections with any value render
// in full.

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-CA') : ''; // YYYY-MM-DD style

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const calcAge = (dob) => {
  if (!dob) return '';
  const yrs = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  return Number.isNaN(yrs) ? '' : String(yrs);
};

const hasValue = (v) => {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.values(v).some(hasValue);
  if (typeof v === 'number') return v !== 0;
  return true;
};

const composeAddress = (parts) =>
  parts.filter(Boolean).map(p => String(p).trim()).filter(Boolean).join(', ');

// Section block — cyan heading + gray bg + 2-column inner grid
const Section = ({ title, children, dense = false }) => (
  <section className="ps-section">
    <h3>{title}</h3>
    <div className={dense ? 'rows dense' : 'rows'}>{children}</div>
  </section>
);

// One field inline: "Label : Value"
const Field = ({ label, value }) => (
  <p className="field">
    <span className="label">{label} :</span>
    <span className="value">{value || ''}</span>
  </p>
);

const SectionBanner = ({ children }) => (
  <div className="banner">{children}</div>
);

const PrintPassportPool = () => {
  const { id } = useParams();
  const [passport, setPassport] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const pRes = await passportApi.getById(id);
        const p = pRes.data?.passport || pRes.data;
        setPassport(p);
        const candidateId = p?.candidateId?._id || p?.candidateId;
        if (candidateId) {
          const profRes = await personsApi.getProfile(candidateId);
          setProfile(profRes.data);
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load passport detail');
      }
    })();
  }, [id]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!passport) return <div className="p-8 text-gray-400">Loading…</div>;

  const c = profile?.candidate || {};
  const docs = profile?.documents || {};
  const demands = profile?.demands || [];
  const activeDemand = demands.find(d => d.status === 'assigned')?.demandId
    || demands[0]?.demandId
    || null;

  const photoUrl = docs?.photoFile?.url
    ? (docs.photoFile.url.startsWith('http')
        ? docs.photoFile.url
        : `${import.meta.env.VITE_SERVER_URL || ''}${docs.photoFile.url}`)
    : null;

  const printedAt = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium', timeStyle: 'short'
  });

  // ── Section data ──────────────────────────────────────────────────────
  const basicInfo = {
    fullName: passport.fullName,
    gender: passport.gender,
    dateOfBirth: passport.dateOfBirth,
    maritalStatus: c.maritalStatus,
    religion: c.religion,
    ssid: c.feimsRegistrationNumber,
    submissionNo: c.dofeFileNumber
  };

  const permanent = {
    municipality: c.permanentMunicipality,
    wardNo: c.permanentWardNo,
    district: c.permanentDistrict,
    province: c.permanentProvince
  };

  const temporary = {
    address: c.temporaryAddress,
    municipality: c.temporaryMunicipality,
    district: c.temporaryDistrict,
    province: c.temporaryProvince
  };

  const contact = {
    phone: c.phone,
    alternatePhone: c.alternatePhone,
    email: c.email
  };

  const citizenship = {
    no: c.nationalIdNumber,
    issuedDistrict: passport.issuedDistrict
  };

  const passportInfo = {
    no: passport.passportNumber,
    issueDate: passport.issueDate
  };

  const documents = {
    citizenship: docs?.citizenshipFile?.url || docs?.nationalIdFile?.url,
    passport: docs?.passportFile?.url
  };

  const nominee = c.nomineeInfo || {};
  const family = {
    fatherName: nominee.fatherName,
    motherName: nominee.motherName
  };
  const marriage = {
    spouseName: nominee.spouseName,
    noOfChildren: nominee.noOfChildren,
    spouseAge: nominee.spouseAge
  };
  const emergencyPerson = {
    person: nominee.emergencyContactPerson,
    number: nominee.emergencyContactNumber
  };
  const emergencyAddress = nominee.emergencyContactAddress;
  const nomineeContact = {
    name: nominee.nomineeName,
    relation: nominee.nomineeRelation
  };
  const nomineeAddr = nominee.nomineeAddress;

  const workerInfo = {
    name: passport.fullName,
    passportNo: passport.passportNumber,
    visaNo: c.visaNumber,
    visaIssued: c.visaReceivedDate || c.visaIssuedDate,
    visaExpiry: c.visaExpiryDate
  };
  const companyInfo = {
    country: activeDemand?.employerCountry || c.desiredCountry,
    company: activeDemand?.employerCompanyName,
    skill: activeDemand?.jobCategory || c.desiredJobCategory
  };

  // Optional extras (kept for completeness — render only if data exists)
  const bank = c.bankInfo || {};
  const training = Array.isArray(c.training) ? c.training : [];
  const academic = Array.isArray(c.academic) ? c.academic : [];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 8mm 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ps-section { break-inside: avoid; }
          .banner       { break-inside: avoid; }
        }
        body { font-family: 'Inter', system-ui, sans-serif; background: white; color: #374151; }
        .sheet { max-width: 210mm; margin: 0 auto; padding: 14px 16px; background: white; }
        .header-bar { border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 12px;
                      display: flex; align-items: flex-start; justify-content: space-between; }
        .header-bar h1 { font-size: 18px; font-weight: 700; color: #0ea5e9; margin: 0; }
        .header-bar .sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
        .header-bar .meta { text-align: right; font-size: 10px; color: #9ca3af; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
        .ps-section { background: #f4f6f8; border-radius: 4px; padding: 12px 14px; margin-bottom: 12px; }
        .ps-section h3 { font-size: 13px; font-weight: 700; color: #06b6d4; margin: 0 0 8px;
                         letter-spacing: 0.01em; }
        .rows { display: flex; flex-direction: column; gap: 4px; }
        .rows.dense { gap: 2px; }
        .field { margin: 0; font-size: 11.5px; line-height: 1.45; color: #4b5563; }
        .field .label { color: #6b7280; margin-right: 4px; }
        .field .value { color: #111827; }
        .photo-wrap { display: flex; justify-content: center; align-items: center;
                      min-height: 130px; }
        .photo-wrap img { max-width: 100px; max-height: 130px; object-fit: cover;
                          border: 1px solid #e5e7eb; border-radius: 3px; background: white; }
        .photo-wrap .placeholder { color: #9ca3af; font-size: 10.5px; font-style: italic; }
        .doc-link { font-size: 11px; color: #0ea5e9; text-decoration: none; }
        .doc-missing { font-size: 11px; color: #9ca3af; }
        .banner { background: white; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;
                  padding: 8px 14px; margin: 12px 0; font-size: 11px; font-weight: 600;
                  letter-spacing: 0.08em; color: #6b7280; text-transform: uppercase; }
        .listrow { font-size: 11.5px; padding: 2px 0; border-bottom: 1px dotted #e5e7eb; color: #4b5563; }
        .listrow strong { color: #111827; }
        .listrow:last-child { border-bottom: none; }

        .toolbar { position: fixed; top: 12px; right: 12px; display: flex; gap: 8px; z-index: 50; }
        .toolbar button { padding: 6px 12px; font-size: 12px; font-weight: 500; border-radius: 6px;
                          border: none; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        .btn-print { background: #06b6d4; color: white; }
        .btn-close { background: #f3f4f6; color: #374151; }
      `}</style>

      <div className="no-print toolbar">
        <button className="btn-print" onClick={() => window.print()}>Print / Save PDF</button>
        <button className="btn-close" onClick={() => window.close()}>Close</button>
      </div>

      <div className="sheet">
        {/* Header */}
        <div className="header-bar">
          <div>
            <h1>{passport.fullName || 'Person Detail'}</h1>
            <div className="sub">
              {passport.fullNameNepali && <span>{passport.fullNameNepali} · </span>}
              Passport: <span style={{ fontFamily: 'monospace', color: '#374151' }}>{passport.passportNumber}</span>
            </div>
          </div>
          <div className="meta">
            <div>Generated: {printedAt}</div>
            <div style={{ marginTop: 2, fontFamily: 'monospace' }}>
              {passport._id?.toString().slice(-8).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Row 1 — Basic Info | Profile Picture */}
        <div className="grid2">
          {hasValue(basicInfo) && (
            <Section title="Basic Info">
              <Field label="Full Name"      value={passport.fullName} />
              <Field label="Gender"         value={cap(passport.gender)} />
              <Field label="Date Of Birth"  value={fmt(passport.dateOfBirth)} />
              <Field label="Age"            value={calcAge(passport.dateOfBirth)} />
              <Field label="Marital Status" value={cap(c.maritalStatus)} />
              <Field label="Religion"       value={c.religion} />
              <Field label="SSID"           value={c.feimsRegistrationNumber} />
              <Field label="Submission No"  value={c.dofeFileNumber} />
            </Section>
          )}

          <Section title="Profile Picture">
            <div className="photo-wrap">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" />
              ) : (
                <span className="placeholder">No photo uploaded</span>
              )}
            </div>
          </Section>
        </div>

        {/* Row 2 — Permanent Address | Temporary Address */}
        <div className="grid2">
          {hasValue(permanent) && (
            <Section title="Permanent Address">
              <p className="field">
                <span className="value">
                  {composeAddress([
                    permanent.municipality && `${permanent.municipality}${permanent.wardNo ? `- ${permanent.wardNo}` : ''}`,
                    permanent.district,
                    permanent.province,
                    'Nepal'
                  ])}
                </span>
              </p>
              {permanent.municipality && (
                <Field label="City" value={permanent.municipality} />
              )}
            </Section>
          )}

          {hasValue(temporary) && (
            <Section title="Temporary Address">
              <p className="field">
                <span className="value">
                  {composeAddress([
                    temporary.address,
                    temporary.municipality,
                    temporary.district,
                    temporary.province
                  ])}
                </span>
              </p>
              {temporary.municipality && (
                <Field label="City" value={temporary.municipality} />
              )}
            </Section>
          )}
        </div>

        {/* Row 3 — Contact Info | Citizenship Info */}
        <div className="grid2">
          {hasValue(contact) && (
            <Section title="Contact Info">
              <Field label="Mobile" value={c.phone} />
              <Field label="Phone"  value={c.alternatePhone} />
              <Field label="Email"  value={c.email} />
            </Section>
          )}

          {hasValue(citizenship) && (
            <Section title="Citizenship Info">
              <Field label="Citizenship No." value={c.nationalIdNumber} />
              <Field label="Issued District" value={passport.issuedDistrict} />
            </Section>
          )}
        </div>

        {/* Row 4 — Passport Info | Documents */}
        <div className="grid2">
          {hasValue(passportInfo) && (
            <Section title="Passport Info">
              <Field label="Passport No." value={passport.passportNumber} />
              <Field label="Issued Date"  value={fmt(passport.issueDate)} />
              {passport.expiryDate && (
                <Field label="Expiry Date" value={fmt(passport.expiryDate)} />
              )}
            </Section>
          )}

          <Section title="Documents">
            <p className="field">
              <span className="label">Citizenship Document :</span>
              {documents.citizenship
                ? <a className="doc-link" href={documents.citizenship} target="_blank" rel="noreferrer">View</a>
                : <span className="doc-missing">No Document</span>}
            </p>
            <p className="field">
              <span className="label">Passport Document :</span>
              {documents.passport
                ? <a className="doc-link" href={documents.passport} target="_blank" rel="noreferrer">View</a>
                : <span className="doc-missing">No Document</span>}
            </p>
          </Section>
        </div>

        {/* Row 5 — Basic Family Info | Marriage Info */}
        <div className="grid2">
          {hasValue(family) && (
            <Section title="Basic Family Info">
              <Field label="Father Name" value={nominee.fatherName} />
              <Field label="Mother Name" value={nominee.motherName} />
            </Section>
          )}

          {hasValue(marriage) && (
            <Section title="Marriage Info">
              <Field label="Spouse Name"   value={nominee.spouseName} />
              <Field label="No Of Children" value={nominee.noOfChildren != null ? String(nominee.noOfChildren) : ''} />
              <Field label="Spouse Age"    value={nominee.spouseAge != null ? String(nominee.spouseAge) : ''} />
            </Section>
          )}
        </div>

        {/* Row 6 — Emergency Contact Info | Emergency Contact Address */}
        <div className="grid2">
          {hasValue(emergencyPerson) && (
            <Section title="Emergency Contact Info">
              <Field label="Emergency Contact Person" value={nominee.emergencyContactPerson} />
              <Field label="Contact Number"          value={nominee.emergencyContactNumber} />
            </Section>
          )}

          {hasValue(emergencyAddress) && (
            <Section title="Emergency Contact Address">
              <p className="field"><span className="value">{nominee.emergencyContactAddress}</span></p>
            </Section>
          )}
        </div>

        {/* Row 7 — Nominee Info | Nominee Address */}
        <div className="grid2">
          {hasValue(nomineeContact) && (
            <Section title="Nominee Info">
              <Field label="Name"     value={nominee.nomineeName} />
              <Field label="Relation" value={nominee.nomineeRelation} />
            </Section>
          )}

          {hasValue(nomineeAddr) && (
            <Section title="Nominee Address">
              <p className="field"><span className="value">{nominee.nomineeAddress}</span></p>
            </Section>
          )}
        </div>

        {/* Work Detail divider */}
        {(hasValue(workerInfo) || hasValue(companyInfo)) && (
          <SectionBanner>Work Detail Information</SectionBanner>
        )}

        {/* Row 8 — Worker Info | Company Info */}
        <div className="grid2">
          {hasValue(workerInfo) && (
            <Section title="Worker Info">
              <Field label="Name"             value={passport.fullName} />
              <Field label="Passport No."     value={passport.passportNumber} />
              <Field label="Visa No"          value={c.visaNumber} />
              <Field label="Visa Issued Date" value={fmt(c.visaReceivedDate || c.visaIssuedDate)} />
              <Field label="Visa Expiry Date" value={fmt(c.visaExpiryDate)} />
            </Section>
          )}

          {hasValue(companyInfo) && (
            <Section title="Company Info">
              <Field label="Country Name" value={companyInfo.country} />
              <Field label="Company Name" value={companyInfo.company} />
              <Field label="Skill"        value={companyInfo.skill} />
            </Section>
          )}
        </div>

        {/* Optional extras — only shown if present */}
        {(hasValue(bank) || training.length > 0 || academic.length > 0) && (
          <SectionBanner>Additional Information</SectionBanner>
        )}

        <div className="grid2">
          {hasValue(bank) && (
            <Section title="Bank Account Info">
              <Field label="Bank Name"      value={bank.bankName} />
              <Field label="Account No."    value={bank.accountNo} />
              <Field label="Account Holder" value={bank.accountHolderName} />
              <Field label="Relation"       value={bank.relation} />
            </Section>
          )}

          {training.length > 0 && (
            <Section title="Training" dense>
              {training.map((t, i) => (
                <div key={i} className="listrow">
                  <strong>{t.name || '—'}</strong>{t.institute ? ` · ${t.institute}` : ''}
                </div>
              ))}
            </Section>
          )}

          {academic.length > 0 && (
            <Section title="Academic" dense>
              {academic.map((a, i) => (
                <div key={i} className="listrow">
                  <strong>{a.qualification || '—'}</strong>
                  {a.institutionName ? ` · ${a.institutionName}` : ''}
                  {a.institutionAddress ? `, ${a.institutionAddress}` : ''}
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </>
  );
};

export default PrintPassportPool;
