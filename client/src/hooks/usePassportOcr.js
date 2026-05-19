import { useState, useCallback, useRef } from 'react';
import { passportApi, candidatesApi } from '../api';
import { devError } from '../utils/devLog';

const STEPS = { UPLOAD: 'upload', PROCESSING: 'processing', REVIEW: 'review', SUCCESS: 'success' };

const EMPTY_FORM = {
  passportNumber: '', personalNumber: '', fullName: '', surname: '', givenNames: '',
  dateOfBirth: '', dateOfBirthBS: '', gender: '', issueDate: '', issueDateBS: '',
  expiryDate: '', expiryDateBS: '', issuedDistrict: '', location: '', notes: '',
};

export function usePassportOcr() {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [confidence, setConfidence] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [scannedImageUrl, setScannedImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedPassport, setSavedPassport] = useState(null);

  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [createNewCandidate, setCreateNewCandidate] = useState(false);
  const [newCandidateData, setNewCandidateData] = useState({ fullName: '', phone: '' });

  const debounceRef = useRef(null);

  const selectFile = (selectedFile) => {
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

  const scan = async () => {
    if (!file) return;
    setStep(STEPS.PROCESSING);
    setLoading(true);
    setError(null);
    try {
      const response = await passportApi.scan(file);
      const { scannedImageUrl: imageUrl, extractedData: d, confidence: conf, warnings: warn } = response.data;
      setScannedImageUrl(imageUrl || '');
      setConfidence(conf);
      setWarnings(warn || []);
      setFormData({
        ...EMPTY_FORM,
        passportNumber: d.passportNumber || '',
        personalNumber: d.personalNumber || '',
        fullName: d.fullName || '',
        surname: d.surname || '',
        givenNames: d.givenNames || '',
        dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : '',
        dateOfBirthBS: d.dateOfBirthBS || '',
        gender: d.gender || '',
        issueDate: d.issueDate ? d.issueDate.split('T')[0] : '',
        issueDateBS: d.issueDateBS || '',
        expiryDate: d.expiryDate ? d.expiryDate.split('T')[0] : '',
        expiryDateBS: d.expiryDateBS || '',
        issuedDistrict: d.issuedDistrict || '',
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

  const reset = () => {
    setStep(STEPS.UPLOAD);
    setFile(null);
    setPreviewUrl(null);
    setFormData(EMPTY_FORM);
    setConfidence({});
    setWarnings([]);
    setSelectedCandidate(null);
    setCreateNewCandidate(false);
    setNewCandidateData({ fullName: '', phone: '' });
    setCandidateSearch('');
    setShowCandidateDropdown(false);
  };

  const searchCandidates = useCallback(async (query) => {
    if (query.length < 2) { setCandidates([]); return; }
    try {
      const response = await candidatesApi.getAll({ search: query, limit: 10 });
      setCandidates(response.data.data || []);
    } catch (err) {
      devError('Candidate search error:', err);
    }
  }, []);

  const handleCandidateInput = (e) => {
    const value = e.target.value;
    setCandidateSearch(value);
    setSelectedCandidate(null);
    setCreateNewCandidate(false);
    clearTimeout(debounceRef.current);
    if (value.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchCandidates(value);
        setShowCandidateDropdown(true);
      }, 300);
    } else {
      setShowCandidateDropdown(false);
      setCandidates([]);
    }
  };

  const selectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setCandidateSearch(candidate.fullName);
    setShowCandidateDropdown(false);
    setCreateNewCandidate(false);
    setCandidates([]);
  };

  const startNewCandidate = () => {
    setSelectedCandidate(null);
    setCandidateSearch('');
    setShowCandidateDropdown(false);
    setCreateNewCandidate(true);
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

  const save = async () => {
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    try {
      let candidateId = selectedCandidate?._id;
      if (createNewCandidate) {
        const res = await candidatesApi.create(newCandidateData);
        candidateId = res.data._id;
      }
      const response = await passportApi.create({
        candidateId,
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
        scannedImageUrl,
      });
      setSavedPassport(response.data);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      devError('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save passport');
    } finally {
      setSaving(false);
    }
  };

  return {
    STEPS, step,
    file, previewUrl, selectFile, clearFile: () => { setFile(null); setPreviewUrl(null); },
    formData, handleFieldChange,
    confidence, warnings, scannedImageUrl,
    loading, saving, error,
    savedPassport,
    scan, reset, save,
    candidateSearch, candidates, showCandidateDropdown,
    selectedCandidate, createNewCandidate,
    newCandidateData, setNewCandidateData,
    handleCandidateInput, selectCandidate, startNewCandidate,
    cancelNewCandidate: () => { setCreateNewCandidate(false); setNewCandidateData({ fullName: '', phone: '' }); },
  };
}
