import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NEPAL_DISTRICTS } from '../../utils/nepalDistricts';
import { usePassportOcr } from '../../hooks/usePassportOcr';

const ConfidenceIcon = ({ level }) => {
  if (level >= 0.9) return <span className="text-green-600" title="High confidence">🔒</span>;
  if (level >= 0.6) return <span className="text-amber-600" title="Medium confidence">✏️</span>;
  return <span className="text-red-500" title="Low confidence">⚠️</span>;
};

const borderColor = (level) => {
  if (level >= 0.9) return 'border-green-500';
  if (level >= 0.6) return 'border-amber-400';
  return 'border-red-400';
};

const ConfidenceField = ({ label, confKey, confidence, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${borderColor(confidence[confKey] || 0)}`}>
      <ConfidenceIcon level={confidence[confKey] || 0} />
      {children}
    </div>
  </div>
);

export default function PassportScanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const ocr = usePassportOcr();

  const expiryStatus = (() => {
    if (!ocr.formData.expiryDate) return null;
    const diffDays = Math.ceil((new Date(ocr.formData.expiryDate) - new Date()) / 86400000);
    if (diffDays < 0) return { valid: false, text: 'Expired', color: 'text-red-600' };
    const y = Math.floor(diffDays / 365), m = Math.floor((diffDays % 365) / 30);
    const text = `${y > 0 ? y + 'y ' : ''}${m > 0 ? m + 'm ' : ''}remaining`;
    return { valid: diffDays > 180, text, color: diffDays > 180 ? 'text-green-600' : diffDays > 90 ? 'text-amber-600' : 'text-red-600' };
  })();

  if (ocr.step === ocr.STEPS.UPLOAD) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Passport</h1>

            {ocr.error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{ocr.error}</div>}

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                ocr.previewUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary-500'
              }`}
              onDrop={e => { e.preventDefault(); ocr.selectFile(e.dataTransfer.files[0]); }}
              onDragOver={e => e.preventDefault()}
            >
              {ocr.previewUrl ? (
                <div className="relative">
                  <img src={ocr.previewUrl} alt="Passport preview" className="max-h-64 mx-auto rounded-lg" />
                  <button onClick={ocr.clearFile}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600">
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-gray-600 mb-4">Drag passport bio-page photo here</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                      Choose File
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={e => ocr.selectFile(e.target.files?.[0])} className="hidden" />
                  </div>
                  <p className="text-sm text-gray-500 mt-4">JPG, PNG, WebP — max 10MB</p>
                </>
              )}
            </div>

            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-700">
                <strong>Tip:</strong> Place passport flat, good lighting, all 4 corners visible
              </p>
            </div>

            {ocr.previewUrl && (
              <div className="mt-6 flex justify-end">
                <button onClick={ocr.scan} disabled={ocr.loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                  {ocr.loading ? 'Scanning...' : 'Scan Passport'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (ocr.step === ocr.STEPS.PROCESSING) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Scanning Passport...</h1>
            <div className="flex gap-8">
              <div className="w-48">
                <img src={ocr.previewUrl} alt="Passport preview" className="w-full rounded-lg" />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 scanning-line" />
                </div>
                <p className="mt-4 text-gray-600">Reading passport data...</p>
              </div>
            </div>
          </div>
          <style>{`
            .scanning-line {
              background: linear-gradient(90deg, transparent, #4f46e5, transparent);
              height: 4px;
              animation: scan 1.5s ease-in-out infinite;
            }
            @keyframes scan {
              0% { top: 0; } 50% { top: calc(100% - 4px); } 100% { top: 0; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (ocr.step === ocr.STEPS.REVIEW) {
    const { formData, confidence, warnings, scannedImageUrl, previewUrl } = ocr;
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Passport Data</h1>

          {ocr.error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{ocr.error}</div>}

          {warnings.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-md text-sm">
              <ul className="list-disc list-inside">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-8">
              <div className="w-72 flex-shrink-0">
                <img src={scannedImageUrl || previewUrl} alt="Scanned passport" className="w-full rounded-lg border" />
                <button onClick={ocr.reset}
                  className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                  Re-scan
                </button>
              </div>

              <div className="flex-1">
                {/* Candidate selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Candidate *</label>
                  {!ocr.createNewCandidate ? (
                    <div className="relative">
                      <input type="text" value={ocr.candidateSearch} onChange={ocr.handleCandidateInput}
                        placeholder="Search candidate by name or phone..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md" autoComplete="off" />
                      {ocr.showCandidateDropdown && ocr.candidates.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {ocr.candidates.map(c => (
                            <button key={c._id} type="button" onClick={() => ocr.selectCandidate(c)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100">
                              <div className="font-medium">{c.fullName}</div>
                              <div className="text-gray-500 text-xs">{c.phone}</div>
                            </button>
                          ))}
                          <button type="button" onClick={ocr.startNewCandidate}
                            className="w-full px-4 py-2 text-left text-primary-600 hover:bg-primary-50 border-t">
                            + Create new candidate
                          </button>
                        </div>
                      )}
                      {ocr.candidateSearch.length >= 2 && ocr.candidates.length === 0 && (
                        <button type="button" onClick={ocr.startNewCandidate}
                          className="mt-2 text-sm text-primary-600 hover:underline">
                          + Create new candidate
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input type="text" name="fullName" value={ocr.newCandidateData.fullName}
                        onChange={e => ocr.setNewCandidateData(p => ({ ...p, fullName: e.target.value }))}
                        placeholder="Full Name *" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                      <input type="tel" name="phone" value={ocr.newCandidateData.phone}
                        onChange={e => ocr.setNewCandidateData(p => ({ ...p, phone: e.target.value }))}
                        placeholder="Phone Number *" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                      <button type="button" onClick={ocr.cancelNewCandidate}
                        className="text-sm text-gray-600 hover:underline">
                        ← Select existing candidate
                      </button>
                    </div>
                  )}
                </div>

                {/* Passport fields */}
                <div className="grid grid-cols-2 gap-4">
                  <ConfidenceField label="Passport Number *" confKey="passportNumber" confidence={confidence}>
                    <input type="text" name="passportNumber" value={formData.passportNumber}
                      onChange={ocr.handleFieldChange} className="flex-1 ml-2 outline-none" />
                  </ConfidenceField>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personal No.</label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${formData.personalNumber ? 'border-green-500' : 'border-gray-300'}`}>
                      <input type="text" name="personalNumber" value={formData.personalNumber}
                        onChange={ocr.handleFieldChange} placeholder="Optional" className="flex-1 ml-2 outline-none" />
                    </div>
                  </div>

                  <ConfidenceField label="Full Name *" confKey="name" confidence={confidence}>
                    <input type="text" name="fullName" value={formData.fullName}
                      onChange={ocr.handleFieldChange} className="flex-1 ml-2 outline-none" />
                  </ConfidenceField>

                  <ConfidenceField label="Date of Birth (BS)" confKey="dateOfBirth" confidence={confidence}>
                    <input type="text" name="dateOfBirthBS" value={formData.dateOfBirthBS}
                      onChange={ocr.handleFieldChange} placeholder="2081/09/15" className="flex-1 ml-2 outline-none" />
                    <input type="hidden" name="dateOfBirth" value={formData.dateOfBirth} />
                  </ConfidenceField>

                  <ConfidenceField label="Gender" confKey="gender" confidence={confidence}>
                    <select name="gender" value={formData.gender} onChange={ocr.handleFieldChange}
                      className="flex-1 ml-2 outline-none bg-transparent">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </ConfidenceField>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date (BS)</label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${borderColor(0.5)}`}>
                      <ConfidenceIcon level={0.5} />
                      <input type="text" name="issueDateBS" value={formData.issueDateBS}
                        onChange={ocr.handleFieldChange} placeholder="2077/01/27" className="flex-1 ml-2 outline-none" />
                      <input type="hidden" name="issueDate" value={formData.issueDate} />
                    </div>
                  </div>

                  <ConfidenceField label="Expiry Date (BS) *" confKey="expiryDate" confidence={confidence}>
                    <input type="text" name="expiryDateBS" value={formData.expiryDateBS}
                      onChange={ocr.handleFieldChange} placeholder="2087/01/26" className="flex-1 ml-2 outline-none" />
                    <input type="hidden" name="expiryDate" value={formData.expiryDate} />
                  </ConfidenceField>

                  <ConfidenceField label="Issued District" confKey="issuedDistrict" confidence={confidence}>
                    <select name="issuedDistrict" value={formData.issuedDistrict} onChange={ocr.handleFieldChange}
                      className="flex-1 ml-2 outline-none bg-transparent">
                      <option value="">Select district</option>
                      {NEPAL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </ConfidenceField>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                    <input type="text" name="location" value={formData.location} onChange={ocr.handleFieldChange}
                      placeholder="e.g., Cabinet A, Shelf 3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2" />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={ocr.handleFieldChange}
                    rows={2} placeholder="Optional notes..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>

                {expiryStatus && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`font-medium ${expiryStatus.color}`}>{expiryStatus.text}</span>
                    <span className={expiryStatus.valid ? 'text-green-600' : 'text-red-600'}>
                      {expiryStatus.valid ? '✓ Valid' : '⚠ Expiring soon'}
                    </span>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-4">
                  <button onClick={ocr.reset}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                    Re-scan
                  </button>
                  <button onClick={ocr.save} disabled={ocr.saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
                    {ocr.saving ? 'Saving...' : 'Confirm & Save passport'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (ocr.step === ocr.STEPS.SUCCESS) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Passport saved — {ocr.savedPassport?.passportNumber}
            </h2>
            <p className="text-gray-600 mb-6">{ocr.savedPassport?.fullName}</p>
            <p className="text-gray-700 mb-6">What would you like to do next?</p>
            <div className="space-y-3">
              <button onClick={() => navigate('/demands')}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                Allocate to a demand →
              </button>
              <button onClick={() => navigate('/passports')}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                Save to passport pool — allocate later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
