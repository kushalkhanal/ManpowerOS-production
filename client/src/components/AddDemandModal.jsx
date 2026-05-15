import { useState, useEffect } from 'react';
import { useJobDemands } from '../hooks/useJobDemands';
import { DESIRED_COUNTRIES, JOB_CATEGORIES } from '../utils/constants';

const AddDemandModal = ({ isOpen, onClose, onSuccess }) => {
  const { createDemand, loading } = useJobDemands();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState({ demandLetter: null, powerOfAttorney: null, embassyAttested: null });

  const [formData, setFormData] = useState({
    employerCompanyName: '',
    shortCompanyCode: '',
    employerCountry: '',
    employerCity: '',
    employerContactPerson: '',
    employerPhone: '',
    employerEmail: '',
    demandLetterNumber: '',
    demandLetterDate: '',
    demandLetterExpiryDate: '',
    lotNumber: '',
    jobCategory: '',
    totalPositions: '',
    basicSalaryUSD: '',
    accommodationProvided: false,
    foodProvided: false,
    contractDurationMonths: '',
    workingHoursPerDay: '',
    purbaSwukritiNumber: '',
    purbaSwukritiDate: '',
    purbaSwukritiExpiryDate: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrors({});
      setFiles({ demandLetter: null, powerOfAttorney: null, embassyAttested: null });
      setFormData({
        employerCompanyName: '',
        shortCompanyCode: '',
        employerCountry: '',
        employerCity: '',
        employerContactPerson: '',
        employerPhone: '',
        employerEmail: '',
        demandLetterNumber: '',
        demandLetterDate: '',
        demandLetterExpiryDate: '',
        lotNumber: '',
        jobCategory: '',
        totalPositions: '',
        basicSalaryUSD: '',
        accommodationProvided: false,
        foodProvided: false,
        contractDurationMonths: '',
        workingHoursPerDay: '',
        purbaSwukritiNumber: '',
        purbaSwukritiDate: '',
        purbaSwukritiExpiryDate: '',
        notes: ''
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const { name, files: newFiles } = e.target;
    if (newFiles?.[0]) {
      setFiles(prev => ({ ...prev, [name]: newFiles[0] }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.employerCompanyName.trim()) newErrors.employerCompanyName = 'Company name required';
    if (!formData.employerCountry) newErrors.employerCountry = 'Country required';
    if (!formData.totalPositions || formData.totalPositions < 1) newErrors.totalPositions = 'Valid position count required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.lotNumber.trim()) newErrors.lotNumber = 'Lot number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'lotNumber' || (value !== '' && value !== false)) {
          data.append(key, value);
        }
      });
      if (files.demandLetter) data.append('demandLetter', files.demandLetter);
      if (files.powerOfAttorney) data.append('powerOfAttorney', files.powerOfAttorney);
      if (files.embassyAttested) data.append('embassyAttested', files.embassyAttested);
      await createDemand(data);
      onSuccess?.();
      onClose();
    } catch (err) {
      const apiErrors = err.response?.data?.errors || [];
      const fieldErrors = {};
      apiErrors.forEach((issue) => {
        if (issue?.field) fieldErrors[issue.field] = issue.message;
      });

      const submitMessage = apiErrors.length
        ? apiErrors.map((issue) => issue.message).join(', ')
        : (err.response?.data?.message || 'Failed to create demand');

      setErrors({ ...fieldErrors, submit: submitMessage });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add Job Demand</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="px-6 py-4">
          <div className="flex mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {errors.submit}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Employer Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                  <input type="text" name="employerCompanyName" value={formData.employerCompanyName} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Employer company name" />
                  {errors.employerCompanyName && <p className="text-red-500 text-sm mt-1">{errors.employerCompanyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Short Company Code</label>
                  <input type="text" name="shortCompanyCode" value={formData.shortCompanyCode} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="e.g., ABC, QTR-01" />
                  {errors.shortCompanyCode && <p className="text-red-500 text-sm mt-1">{errors.shortCompanyCode}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country *</label>
                    <select name="employerCountry" value={formData.employerCountry} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md">
                      <option value="">Select Country</option>
                      {DESIRED_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.employerCountry && <p className="text-red-500 text-sm mt-1">{errors.employerCountry}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input type="text" name="employerCity" value={formData.employerCity} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="City" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <input type="text" name="employerContactPerson" value={formData.employerContactPerson} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Contact person name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Phone</label>
                    <input type="text" name="employerPhone" value={formData.employerPhone} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Phone number" />
                    {errors.employerPhone && <p className="text-red-500 text-sm mt-1">{errors.employerPhone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Email</label>
                  <input type="email" name="employerEmail" value={formData.employerEmail} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="employer@company.com" />
                  {errors.employerEmail && <p className="text-red-500 text-sm mt-1">{errors.employerEmail}</p>}
                </div>

                <h3 className="text-lg font-medium text-gray-900 pt-4">Job Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Category *</label>
                    <select name="jobCategory" value={formData.jobCategory} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md">
                      <option value="">Select Category</option>
                      {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.jobCategory && <p className="text-red-500 text-sm mt-1">{errors.jobCategory}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Positions *</label>
                    <input type="number" name="totalPositions" value={formData.totalPositions} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" min="1" />
                    {errors.totalPositions && <p className="text-red-500 text-sm mt-1">{errors.totalPositions}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Basic Salary (USD)</label>
                    <input type="number" name="basicSalaryUSD" value={formData.basicSalaryUSD} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Monthly salary in USD" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contract Duration (months)</label>
                    <input type="number" name="contractDurationMonths" value={formData.contractDurationMonths} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Months" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Working Hours/Day</label>
                    <input type="number" name="workingHoursPerDay" value={formData.workingHoursPerDay} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Hours per day" />
                  </div>
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input type="checkbox" name="accommodationProvided" checked={formData.accommodationProvided} onChange={handleChange}
                      className="mr-2" />
                    <span className="text-sm text-gray-700">Accommodation Provided</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" name="foodProvided" checked={formData.foodProvided} onChange={handleChange}
                      className="mr-2" />
                    <span className="text-sm text-gray-700">Food Provided</span>
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Demand Letter Details</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Demand Letter Number</label>
                  <input type="text" name="demandLetterNumber" value={formData.demandLetterNumber} onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="e.g., MOL/Qatar/2025/1234" />
                  {errors.demandLetterNumber && <p className="text-red-500 text-sm mt-1">{errors.demandLetterNumber}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Demand Letter Date</label>
                    <input type="date" name="demandLetterDate" value={formData.demandLetterDate} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" />
                    {errors.demandLetterDate && <p className="text-red-500 text-sm mt-1">{errors.demandLetterDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <input type="date" name="demandLetterExpiryDate" value={formData.demandLetterExpiryDate} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" />
                    {errors.demandLetterExpiryDate && <p className="text-red-500 text-sm mt-1">{errors.demandLetterExpiryDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lot Number *</label>
                    <input type="text" name="lotNumber" value={formData.lotNumber} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="e.g., LOT-2025-001" />
                    {errors.lotNumber && <p className="text-red-500 text-sm mt-1">{errors.lotNumber}</p>}
                  </div>
                </div>

                <h3 className="text-lg font-medium text-gray-900 pt-4">Purba Swukriti (Optional)</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Swukriti Number</label>
                    <input type="text" name="purbaSwukritiNumber" value={formData.purbaSwukritiNumber} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Swukriti Date</label>
                    <input type="date" name="purbaSwukritiDate" value={formData.purbaSwukritiDate} onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Swukriti Expiry Date</label>
                  <input type="date" name="purbaSwukritiExpiryDate" value={formData.purbaSwukritiExpiryDate} onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border rounded-md" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange}
                    rows={3} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Additional notes..." />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Summary & Upload</h3>

                <div className="bg-gray-50 rounded-md p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company:</span>
                    <span className="font-medium">{formData.employerCompanyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Short Code:</span>
                    <span className="font-medium">{formData.shortCompanyCode || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Country:</span>
                    <span className="font-medium">{formData.employerCountry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Positions:</span>
                    <span className="font-medium">{formData.totalPositions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Demand Letter:</span>
                    <span className="font-medium">{formData.demandLetterNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expiry:</span>
                    <span className="font-medium">{formData.demandLetterExpiryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lot Number:</span>
                    <span className="font-medium">{formData.lotNumber}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Demand Letter</label>
                    <input type="file" name="demandLetter" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange}
                      className="mt-1 w-full text-sm" />
                    {files.demandLetter && <p className="text-green-600 text-xs mt-1">Selected: {files.demandLetter.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Power of Attorney</label>
                    <input type="file" name="powerOfAttorney" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange}
                      className="mt-1 w-full text-sm" />
                    {files.powerOfAttorney && <p className="text-green-600 text-xs mt-1">Selected: {files.powerOfAttorney.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Embassy Attested</label>
                    <input type="file" name="embassyAttested" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange}
                      className="mt-1 w-full text-sm" />
                    {files.embassyAttested && <p className="text-green-600 text-xs mt-1">Selected: {files.embassyAttested.name}</p>}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Note:</strong> This demand will be created as "Active". You can assign candidates once medical, orientation, and insurance/SSF are completed.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between">
          {step > 1 ? (
            <button type="button" onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
              Back
            </button>
          ) : (
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
          )}
          
          {step < 3 ? (
            <button type="button" onClick={handleNext} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              Next
            </button>
          ) : (
            <button type="submit" form="demand-form" onClick={handleSubmit} disabled={submitting || loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Demand'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddDemandModal;