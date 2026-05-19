import { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { useSponsors } from '../../hooks/useSponsors';
import { staffApi } from '../../api';
import { NEPAL_PROVINCES, NEPAL_DISTRICTS, NEPAL_DISTRICTS_BY_PROVINCE } from '../../utils/constants';
import { debounce } from '../../utils/debounce';

const SponsorFormModal = ({ isOpen, onClose, onSuccess, sponsor = null }) => {
  const { createSponsor, updateSponsor, loading } = useSponsors();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [searchStaff, setSearchStaff] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [districtSearch, setDistrictSearch] = useState('');
  const photoInputRef = useRef(null);

  const ROLE_DEFAULT_PERMISSIONS = {
    agent:        ['canViewOwnCandidates'],
    senior_agent: ['canReferCandidates', 'canViewOwnCandidates', 'canViewAllCandidates'],
    partner:      ['canReferCandidates', 'canViewAllCandidates', 'canExportCandidates'],
    coordinator:  ['canReferCandidates', 'canViewAllCandidates', 'canEditOwnCandidates'],
    manager:      ['canReferCandidates', 'canViewAllCandidates', 'canEditOwnCandidates', 'canExportCandidates'],
  };

  const [formData, setFormData] = useState({
    fullName: '',
    fullNameNepali: '',
    phone: '',
    alternatePhone: '',
    email: '',
    currentAddress: '',
    citizenshipNumber: '',
    citizenshipIssuedDistrict: '',
    citizenshipIssuedDate: '',
    role: 'agent',
    permissions: ['canViewOwnCandidates'],
    assignedStaffId: '',
    notes: '',
    primaryArea: '',
    overseasCompany: '',
    sponsorNumber: '',
    sponsorContactNumber: '',
    coverageProvinces: [],
    coverageDistricts: [],
    coverageMunicipalities: []
  });

  useEffect(() => {
    if (isOpen) {
      loadStaff();
      setPhotoFile(null);
      setPhotoPreview(sponsor?.photo || null);
      setDistrictSearch('');
      if (sponsor) {
        setFormData({
          fullName: sponsor.fullName || '',
          fullNameNepali: sponsor.fullNameNepali || '',
          phone: sponsor.phone || '',
          alternatePhone: sponsor.alternatePhone || '',
          email: sponsor.email || '',
          currentAddress: sponsor.currentAddress || '',
          citizenshipNumber: sponsor.citizenshipNumber || '',
          citizenshipIssuedDistrict: sponsor.citizenshipIssuedDistrict || '',
          citizenshipIssuedDate: sponsor.citizenshipIssuedDate?.split('T')[0] || '',
          role: sponsor.role || 'agent',
          permissions: sponsor.permissions || ROLE_DEFAULT_PERMISSIONS[sponsor.role] || ['canViewOwnCandidates'],
          assignedStaffId: sponsor.assignedStaffId?._id || sponsor.assignedStaffId || '',
          notes: sponsor.notes || '',
          primaryArea: sponsor.primaryArea || '',
          overseasCompany: sponsor.overseasCompany || '',
          sponsorNumber: sponsor.sponsorNumber || '',
          sponsorContactNumber: sponsor.sponsorContactNumber || '',
          coverageProvinces: sponsor.coverageProvinces || [],
          coverageDistricts: sponsor.coverageDistricts || [],
          coverageMunicipalities: sponsor.coverageMunicipalities || []
        });
        setSearchStaff(sponsor.assignedStaffId?.name || '');
      } else {
        setFormData({
          fullName: '',
          fullNameNepali: '',
          phone: '',
          alternatePhone: '',
          email: '',
          currentAddress: '',
          citizenshipNumber: '',
          citizenshipIssuedDistrict: '',
          citizenshipIssuedDate: '',
          role: 'agent',
          permissions: ['canViewOwnCandidates'],
          assignedStaffId: '',
          notes: '',
          primaryArea: '',
          overseasCompany: '',
          sponsorNumber: '',
          sponsorContactNumber: '',
          coverageProvinces: [],
          coverageDistricts: [],
          coverageMunicipalities: []
        });
        setSearchStaff('');
      }
      setStep(1);
      setErrors({});
    }
  }, [isOpen, sponsor]);

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll({ limit: 100 });
      setStaffList(response.data.data || []);
    } catch (err) {
      console.error('Failed to load staff:', err);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'role' ? { permissions: ROLE_DEFAULT_PERMISSIONS[value] || ['canViewOwnCandidates'] } : {})
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleProvinceChange = (province) => {
    setFormData(prev => {
      const newProvinces = prev.coverageProvinces.includes(province)
        ? prev.coverageProvinces.filter(p => p !== province)
        : [...prev.coverageProvinces, province];
      
      const newDistricts = newProvinces.length === 0 
        ? []
        : prev.coverageDistricts.filter(d => {
            const districtInfo = NEPAL_DISTRICTS.find(g => g.districts.includes(d));
            return districtInfo && newProvinces.includes(districtInfo.province);
          });
      
      return {
        ...prev,
        coverageProvinces: newProvinces,
        coverageDistricts: newDistricts
      };
    });
  };

  const handleDistrictChange = (district) => {
    setFormData(prev => ({
      ...prev,
      coverageDistricts: prev.coverageDistricts.includes(district)
        ? prev.coverageDistricts.filter(d => d !== district)
        : [...prev.coverageDistricts, district]
    }));
  };

  const handleStaffSelect = (staff) => {
    setFormData(prev => ({ ...prev, assignedStaffId: staff._id }));
    setSearchStaff(staff.name);
    setShowStaffDropdown(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const normalizeOptionalPhone = (value) => {
        if (!value) return '';
        return value.trim();
      };

      const base = {
        ...formData,
        phone: formData.phone.replace(/[\s\-()]/g, '').trim(),
        alternatePhone: normalizeOptionalPhone(formData.alternatePhone),
        sponsorContactNumber: normalizeOptionalPhone(formData.sponsorContactNumber),
        assignedStaffId: formData.assignedStaffId || undefined,
      };

      let submitData;
      if (photoFile) {
        submitData = new FormData();
        Object.entries(base).forEach(([k, v]) => {
          if (Array.isArray(v)) submitData.append(k, JSON.stringify(v));
          else if (v !== undefined && v !== '') submitData.append(k, v);
        });
        submitData.append('photo', photoFile);
      } else {
        submitData = base;
      }

      if (sponsor) {
        await updateSponsor(sponsor._id, submitData);
      } else {
        await createSponsor(submitData);
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const mappedErrors = {};
        apiErrors.forEach((e) => {
          if (e?.field) {
            mappedErrors[e.field] = e.message || 'Invalid value';
          }
        });
        setErrors({
          ...mappedErrors,
          submit: err.response?.data?.message || 'Please check highlighted fields'
        });
      } else {
        setErrors({ submit: err.response?.data?.message || 'Failed to save sponsor' });
      }
    }
  };

  const getFilteredDistricts = () => {
    if (formData.coverageProvinces.length === 0) {
      return NEPAL_DISTRICTS;
    }
    let districts = [];
    formData.coverageProvinces.forEach(province => {
      if (NEPAL_DISTRICTS_BY_PROVINCE[province]) {
        districts = [...districts, ...NEPAL_DISTRICTS_BY_PROVINCE[province]];
      }
    });
    return districts;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {sponsor ? 'Edit Agent' : 'Add New Agent'}
                </h3>

                

                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {errors.submit}
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-3">
                    {/* Profile photo */}
                    <div className="flex items-center gap-4 mb-1">
                      <div
                        onClick={() => photoInputRef.current?.click()}
                        className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors flex-shrink-0"
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Agent" className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                          {photoPreview ? 'Change photo' : 'Upload photo'}
                        </button>
                        {photoPreview && (
                          <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="ml-3 text-sm text-gray-400 hover:text-red-500">
                            Remove
                          </button>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WEBP · max 5MB</p>
                      </div>
                      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name (Nepali)</label>
                        <input
                          type="text"
                          name="fullNameNepali"
                          value={formData.fullNameNepali}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Primary Phone *</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Alternate Phone</label>
                        <input
                          type="text"
                          name="alternatePhone"
                          value={formData.alternatePhone}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Address</label>
                        <input
                          type="text"
                          name="currentAddress"
                          value={formData.currentAddress}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Citizenship Number</label>
                        <input
                          type="text"
                          name="citizenshipNumber"
                          value={formData.citizenshipNumber}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Issued District</label>
                        <select
                          name="citizenshipIssuedDistrict"
                          value={formData.citizenshipIssuedDistrict}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          <option value="">Select</option>
                          {NEPAL_DISTRICTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="agent">Agent</option>
                        <option value="senior_agent">Senior Agent</option>
                        <option value="partner">Partner</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>

                    {formData.role === 'agent' ? (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium text-gray-700">Access:</span> View own candidates only. No editing or export.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'canReferCandidates', label: 'Can Refer Candidates' },
                            { value: 'canViewOwnCandidates', label: 'View Own Candidates' },
                            { value: 'canEditOwnCandidates', label: 'Edit Own Candidates' },
                            { value: 'canDeleteOwnCandidates', label: 'Delete Own Candidates' },
                            { value: 'canViewAllCandidates', label: 'View All Candidates' },
                            { value: 'canExportCandidates', label: 'Export Candidates' }
                          ].map(perm => (
                            <label key={perm.value} className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm.value)}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    permissions: e.target.checked
                                      ? [...prev.permissions, perm.value]
                                      : prev.permissions.filter(p => p !== perm.value)
                                  }));
                                }}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.role !== 'agent' && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Optional Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Overseas Company</label>
                            <input
                              type="text"
                              name="overseasCompany"
                              value={formData.overseasCompany}
                              onChange={handleChange}
                              placeholder="Company name"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Sponsor Number</label>
                            <input
                              type="text"
                              name="sponsorNumber"
                              value={formData.sponsorNumber}
                              onChange={handleChange}
                              placeholder="Sponsor ID"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Sponsor Contact Number</label>
                            <input
                              type="text"
                              name="sponsorContactNumber"
                              value={formData.sponsorContactNumber}
                              onChange={handleChange}
                              placeholder="Contact number"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Assigned Staff</label>
                            <select
                              name="assignedStaffId"
                              value={formData.assignedStaffId}
                              onChange={handleChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            >
                              <option value="">Select Staff</option>
                              {staffList.map(staff => (
                                <option key={staff._id} value={staff._id}>{staff.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Coverage Districts */}
                    <div className="mt-3 pt-3 border-t">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coverage Districts
                        {formData.coverageDistricts.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-primary-600">{formData.coverageDistricts.length} selected</span>
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder="Search districts…"
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="mb-2 block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                        {NEPAL_DISTRICTS
                          .filter(d => !districtSearch || d.toLowerCase().includes(districtSearch.toLowerCase()))
                          .map(d => {
                            const selected = formData.coverageDistricts.includes(d);
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  coverageDistricts: selected
                                    ? prev.coverageDistricts.filter(x => x !== d)
                                    : [...prev.coverageDistricts, d]
                                }))}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                  selected
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                                }`}
                              >
                                {d}
                              </button>
                            );
                          })}
                      </div>
                      {formData.coverageDistricts.length > 0 && (
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, coverageDistricts: [] }))} className="mt-1 text-xs text-gray-400 hover:text-red-500">
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : sponsor ? 'Update Agent' : 'Add Agent'}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorFormModal;