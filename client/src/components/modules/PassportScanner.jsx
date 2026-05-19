import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { passportApi, candidatesApi } from '../../api';
import { NEPAL_DISTRICTS } from '../../utils/nepalDistricts';
import { devError } from '../../utils/devLog';

const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  REVIEW: 'review',
  SUCCESS: 'success'
};

const ConfidenceIcon = ({ level }) => {
  if (level >= 0.9) {
    return <span className="text-green-600" title="High confidence">🔒</span>;
  } else if (level >= 0.6) {
    return <span className="text-amber-600" title="Medium confidence">✏️</span>;
  }
  return <span className="text-red-500" title="Low confidence">⚠️</span>;
};

const getBorderColor = (level) => {
  if (level >= 0.9) return 'border-green-500';
  if (level >= 0.6) return 'border-amber-400';
  return 'border-red-400';
};

export default function PassportScanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    passportNumber: '',
    personalNumber: '',
    fullName: '',
    surname: '',
    givenNames: '',
    dateOfBirth: '',
    dateOfBirthBS: '',
    gender: '',
    issueDate: '',
    issueDateBS: '',
    expiryDate: '',
    expiryDateBS: '',
    issuedDistrict: '',
    location: '',
    notes: ''
  });
  
  const [confidence, setConfidence] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [scannedImageUrl, setScannedImageUrl] = useState('');
  
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [createNewCandidate, setCreateNewCandidate] = useState(false);
  const [newCandidateData, setNewCandidateData] = useState({ fullName: '', phone: '' });
  
  const [saving, setSaving] = useState(false);
  const [savedPassport, setSavedPassport] = useState(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleScan = async () => {
    if (!file) return;
    
    setStep(STEPS.PROCESSING);
    setLoading(true);
    setError(null);
    
    try {
      const response = await passportApi.scan(file);
      const { scannedImageUrl: imageUrl, extractedData, confidence: conf, warnings: warn } = response.data;
      
      setScanResult(response.data);
      setScannedImageUrl(imageUrl || '');
      setConfidence(conf);
      setWarnings(warn || []);
      
      setFormData({
        passportNumber: extractedData.passportNumber || '',
        personalNumber: extractedData.personalNumber || '',
        fullName: extractedData.fullName || '',
        surname: extractedData.surname || '',
        givenNames: extractedData.givenNames || '',
        dateOfBirth: extractedData.dateOfBirth ? extractedData.dateOfBirth.split('T')[0] : '',
        dateOfBirthBS: extractedData.dateOfBirthBS || '',
        gender: extractedData.gender || '',
        issueDate: extractedData.issueDate ? extractedData.issueDate.split('T')[0] : '',
        issueDateBS: extractedData.issueDateBS || '',
        expiryDate: extractedData.expiryDate ? extractedData.expiryDate.split('T')[0] : '',
        expiryDateBS: extractedData.expiryDateBS || '',
        issuedDistrict: extractedData.issuedDistrict || '',
        location: '',
        notes: ''
      });
      
      setStep(STEPS.REVIEW);
    } catch (err) {
      devError('Scan error:', err);
      setError(err.response?.data?.message || 'Failed to scan passport. Please try again.');
      setStep(STEPS.UPLOAD);
    } finally {
      setLoading(false);
    }
  };

  const handleReScan = () => {
    setStep(STEPS.UPLOAD);
    setFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setFormData({
      passportNumber: '',
      personalNumber: '',
      fullName: '',
      surname: '',
      givenNames: '',
      dateOfBirth: '',
      dateOfBirthBS: '',
      gender: '',
      issueDate: '',
      issueDateBS: '',
      expiryDate: '',
      expiryDateBS: '',
      issuedDistrict: '',
      location: '',
      notes: ''
    });
    setConfidence({});
    setWarnings([]);
    setSelectedCandidate(null);
    setCreateNewCandidate(false);
    setNewCandidateData({ fullName: '', phone: '' });
  };

  const handleCandidateSearch = useCallback(async (query) => {
    if (query.length < 2) {
      setCandidates([]);
      return;
    }
    try {
      const response = await candidatesApi.getAll({ search: query, limit: 10 });
      setCandidates(response.data.data || []);
    } catch (err) {
      devError('Candidate search error:', err);
    }
  }, []);

  const handleCandidateInputChange = (e) => {
    const value = e.target.value;
    setCandidateSearch(value);
    setSelectedCandidate(null);
    setCreateNewCandidate(false);
    
    if (value.length >= 2) {
      const debounce = setTimeout(() => {
        handleCandidateSearch(value);
        setShowCandidateDropdown(true);
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setShowCandidateDropdown(false);
    }
  };

  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setCandidateSearch(candidate.fullName);
    setShowCandidateDropdown(false);
    setCreateNewCandidate(false);
    setCandidates([]);
  };

  const handleCreateNewCandidate = () => {
    setSelectedCandidate(null);
    setCandidateSearch('');
    setShowCandidateDropdown(false);
    setCreateNewCandidate(true);
  };

  const handleNewCandidateChange = (e) => {
    const { name, value } = e.target;
    setNewCandidateData(prev => ({ ...prev, [name]: value }));
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.passportNumber) return 'Passport number is required';
    if (!formData.fullName) return 'Full name is required';
    if (!formData.expiryDate) return 'Expiry date is required';
    if (!selectedCandidate && !createNewCandidate) return 'Please select or create a candidate';
    if (createNewCandidate && !newCandidateData.fullName) return 'Candidate name is required';
    if (createNewCandidate && !newCandidateData.phone) return 'Candidate phone is required';
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      let finalCandidateId = selectedCandidate?._id;
      
      if (createNewCandidate) {
        const newCandidate = await candidatesApi.create({
          ...newCandidateData,
          agencyId: null
        });
        finalCandidateId = newCandidate.data._id;
      }
      
      const passportData = {
        candidateId: finalCandidateId,
        passportNumber: formData.passportNumber,
        personalNumber: formData.personalNumber,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth || null,
        issueDate: formData.issueDate || null,
        expiryDate: formData.expiryDate,
        issuedDistrict: formData.issuedDistrict,
        location: formData.location,
        notes: formData.notes,
        gender: formData.gender,
        scannedImageUrl
      };
      
      const response = await passportApi.create(passportData);
      setSavedPassport(response.data);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      devError('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save passport');
    } finally {
      setSaving(false);
    }
  };

  const calculateExpiryStatus = () => {
    if (!formData.expiryDate) return null;
    
    const expiry = new Date(formData.expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { valid: false, text: 'Expired', color: 'text-red-600' };
    }
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    let text = '';
    if (years > 0) text += `${years}y `;
    if (months > 0) text += `${months}m `;
    text += 'remaining';
    
    return { 
      valid: diffDays > 180, 
      text, 
      color: diffDays > 180 ? 'text-green-600' : diffDays > 90 ? 'text-amber-600' : 'text-red-600'
    };
  };

  const expiryStatus = calculateExpiryStatus();

  if (step === STEPS.UPLOAD) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Passport</h1>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                previewUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary-500'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Passport preview" 
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-gray-600 mb-4">
                    Drag passport bio-page photo here
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Choose File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    JPG, PNG, WebP — max 10MB
                  </p>
                </>
              )}
            </div>
            
            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-700">
                <strong>Tip:</strong> Place passport flat, good lighting, all 4 corners visible
              </p>
            </div>
            
            {previewUrl && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Scanning...' : 'Scan Passport'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.PROCESSING) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Scanning Passport...</h1>
            
            <div className="flex gap-8">
              <div className="w-48">
                <img 
                  src={previewUrl} 
                  alt="Passport preview" 
                  className="w-full rounded-lg"
                />
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 scanning-line"></div>
                </div>
                <p className="mt-4 text-gray-600">Reading passport data...</p>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
          
          <style>{`
            .scanning-line {
              background: linear-gradient(90deg, transparent, #4f46e5, transparent);
              height: 4px;
              animation: scan 1.5s ease-in-out infinite;
            }
            @keyframes scan {
              0% { top: 0; }
              50% { top: calc(100% - 4px); }
              100% { top: 0; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (step === STEPS.REVIEW) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Passport Data</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {warnings.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-md text-sm">
              <ul className="list-disc list-inside">
                {warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-8">
              <div className="w-72 flex-shrink-0">
                <img 
                  src={scannedImageUrl || previewUrl} 
                  alt="Scanned passport" 
                  className="w-full rounded-lg border"
                />
                <button
                  onClick={handleReScan}
                  className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Re-scan
                </button>
              </div>
              
              <div className="flex-1">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Candidate *
                  </label>
                  {!createNewCandidate ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={candidateSearch}
                        onChange={handleCandidateInputChange}
                        placeholder="Search candidate by name or phone..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        autoComplete="off"
                      />
                      {showCandidateDropdown && candidates.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {candidates.map(candidate => (
                            <button
                              key={candidate._id}
                              type="button"
                              onClick={() => handleCandidateSelect(candidate)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100"
                            >
                              <div className="font-medium">{candidate.fullName}</div>
                              <div className="text-gray-500 text-xs">{candidate.phone}</div>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={handleCreateNewCandidate}
                            className="w-full px-4 py-2 text-left text-primary-600 hover:bg-primary-50 border-t"
                          >
                            + Create new candidate
                          </button>
                        </div>
                      )}
                      {candidateSearch.length >= 2 && candidates.length === 0 && (
                        <button
                          type="button"
                          onClick={handleCreateNewCandidate}
                          className="mt-2 text-sm text-primary-600 hover:underline"
                        >
                          + Create new candidate
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="fullName"
                        value={newCandidateData.fullName}
                        onChange={handleNewCandidateChange}
                        placeholder="Full Name *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={newCandidateData.phone}
                        onChange={handleNewCandidateChange}
                        placeholder="Phone Number *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCreateNewCandidate(false);
                          setNewCandidateData({ fullName: '', phone: '' });
                        }}
                        className="text-sm text-gray-600 hover:underline"
                      >
                        ← Select existing candidate
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passport Number *
                    </label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${getBorderColor(confidence.passportNumber)}`}>
                      <ConfidenceIcon level={confidence.passportNumber} />
                      <input
                        type="text"
                        name="passportNumber"
                        value={formData.passportNumber}
                        onChange={handleFieldChange}
                        className="flex-1 ml-2 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal No.
                    </label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${formData.personalNumber ? 'border-green-500' : 'border-gray-300'}`}>
                      <input
                        type="text"
                        name="personalNumber"
                        value={formData.personalNumber}
                        onChange={handleFieldChange}
                        placeholder="Optional"
                        className="flex-1 ml-2 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${getBorderColor(confidence.name)}`}>
                      <ConfidenceIcon level={confidence.name} />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleFieldChange}
                        className="flex-1 ml-2 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth (BS)
                    </label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${getBorderColor(confidence.dateOfBirth)}`}>
                      <ConfidenceIcon level={confidence.dateOfBirth} />
                      <input
                        type="text"
                        name="dateOfBirthBS"
                        value={formData.dateOfBirthBS}
                        onChange={handleFieldChange}
                        placeholder="2081/09/15"
                        className="flex-1 ml-2 outline-none"
                      />
                      <input
                        type="hidden"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${getBorderColor(confidence.gender)}`}>
                      <ConfidenceIcon level={confidence.gender} />
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleFieldChange}
                        className="flex-1 ml-2 outline-none bg-transparent"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Date (BS)
                    </label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${getBorderColor(0.5)}`}>
                      <ConfidenceIcon level={0.5} />
                      <input
                        type="text"
                        name="issueDateBS"
                        value={formData.issueDateBS}
                        onChange={handleFieldChange}
                        placeholder="2077/01/27"
                        className="flex-1 ml-2 outline-none"
                      />
                      <input
                        type="hidden"
                        name="issueDate"
                        value={formData.issueDate}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date (BS) *
                    </label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${getBorderColor(confidence.expiryDate)}`}>
                      <ConfidenceIcon level={confidence.expiryDate} />
                      <input
                        type="text"
                        name="expiryDateBS"
                        value={formData.expiryDateBS}
                        onChange={handleFieldChange}
                        placeholder="2087/01/26"
                        className="flex-1 ml-2 outline-none"
                      />
                      <input
                        type="hidden"
                        name="expiryDate"
                        value={formData.expiryDate}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issued District
                    </label>
                    <div className={`flex items-center border-2 rounded-md px-3 py-2 ${getBorderColor(confidence.issuedDistrict)}`}>
                      <ConfidenceIcon level={confidence.issuedDistrict || 0} />
                      <select
                        name="issuedDistrict"
                        value={formData.issuedDistrict}
                        onChange={handleFieldChange}
                        className="flex-1 ml-2 outline-none bg-transparent"
                      >
                        <option value="">Select district</option>
                        {NEPAL_DISTRICTS.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleFieldChange}
                      placeholder="e.g., Cabinet A, Shelf 3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFieldChange}
                    rows={2}
                    placeholder="Optional notes..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                
                {expiryStatus && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`font-medium ${expiryStatus.color}`}>
                      {expiryStatus.text}
                    </span>
                    <span className={expiryStatus.valid ? 'text-green-600' : 'text-red-600'}>
                      {expiryStatus.valid ? '✓ Valid' : '⚠ Expiring soon'}
                    </span>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={handleReScan}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Re-scan
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Confirm & Save passport'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === STEPS.SUCCESS) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Passport saved — {savedPassport?.passportNumber}
            </h2>
            <p className="text-gray-600 mb-6">
              {savedPassport?.fullName}
            </p>
            
            <p className="text-gray-700 mb-6">
              What would you like to do next?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/demands')}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Allocate to a demand →
              </button>
              <button
                onClick={() => navigate('/passports')}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
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