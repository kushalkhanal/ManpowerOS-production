import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { candidatesApi } from '../api';
import { NEPAL_DISTRICTS } from '../utils/nepalDistricts';
import { showToast } from './ToastProvider';

const NEPAL_PROVINCES = [
  'Koshi Province', 'Madhesh Province', 'Bagmati Province', 'Gandaki Province',
  'Lumbini Province', 'Karnali Province', 'Sudurpashchim Province',
];

const SECTION_TITLES = {
  address:    'Edit Address Information',
  bank:       'Edit Bank Account Info',
  training:   'Edit Training Information',
  academic:   'Edit Academic Information',
  nominee:    'Edit Nominee Information',
  workDetail: 'Edit Work Detail Information',
};

// ── Shared primitives ─────────────────────────────────────────────────────────

const Label = ({ children }) => (
  <label className="block text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-1">
    {children}
  </label>
);

const Input = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    <Label>{label}</Label>
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
    />
  </div>
);

const SelectInput = ({ label, value, onChange, options }) => (
  <div>
    <Label>{label}</Label>
    <select
      value={value ?? ''}
      onChange={onChange}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none bg-white"
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const SubHeading = ({ children }) => (
  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold pb-1 border-b border-gray-100 mt-1">
    {children}
  </p>
);

// ── Section forms ─────────────────────────────────────────────────────────────

function AddressForm({ state, onChange }) {
  const upd = (side, field) => e =>
    onChange(prev => ({ ...prev, [side]: { ...prev[side], [field]: e.target.value } }));
  return (
    <div className="grid grid-cols-2 gap-x-6">
      <div className="space-y-3">
        <SubHeading>Permanent Address</SubHeading>
        <SelectInput label="Province"     value={state.permanent.province}     onChange={upd('permanent', 'province')}     options={NEPAL_PROVINCES} />
        <SelectInput label="District"     value={state.permanent.district}     onChange={upd('permanent', 'district')}     options={NEPAL_DISTRICTS} />
        <Input       label="Municipality" value={state.permanent.municipality} onChange={upd('permanent', 'municipality')} />
        <Input       label="Ward No."     value={state.permanent.wardNo}       onChange={upd('permanent', 'wardNo')} />
      </div>
      <div className="space-y-3">
        <SubHeading>Temporary Address</SubHeading>
        <SelectInput label="Province"     value={state.temporary.province}     onChange={upd('temporary', 'province')}     options={NEPAL_PROVINCES} />
        <SelectInput label="District"     value={state.temporary.district}     onChange={upd('temporary', 'district')}     options={NEPAL_DISTRICTS} />
        <Input       label="Municipality" value={state.temporary.municipality} onChange={upd('temporary', 'municipality')} />
        <Input       label="Address"      value={state.temporary.address}      onChange={upd('temporary', 'address')} />
      </div>
    </div>
  );
}

function BankForm({ state, onChange }) {
  const upd = field => e => onChange(prev => ({ ...prev, [field]: e.target.value }));
  return (
    <div className="grid grid-cols-2 gap-4">
      <Input label="Bank Name"       value={state.bankName}          onChange={upd('bankName')} />
      <Input label="Account No."     value={state.accountNo}         onChange={upd('accountNo')} />
      <Input label="Account Holder"  value={state.accountHolderName} onChange={upd('accountHolderName')} />
      <Input label="Relation"        value={state.relation}          onChange={upd('relation')} />
    </div>
  );
}

function TrainingForm({ items, onChange }) {
  const add    = () => onChange(prev => [...prev, { name: '', institute: '' }]);
  const remove = i  => onChange(prev => prev.filter((_, idx) => idx !== i));
  const upd    = (i, field) => e =>
    onChange(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: e.target.value } : item));
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-6">No training records yet.</p>
      )}
      {items.map((t, i) => (
        <div key={i} className="grid grid-cols-2 gap-3 bg-gray-50/60 border border-gray-100 rounded-lg p-3">
          <Input label="Training Name" value={t.name}      onChange={upd(i, 'name')} />
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input label="Institute" value={t.institute} onChange={upd(i, 'institute')} />
            </div>
            <button
              onClick={() => remove(i)}
              className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Plus size={13} /> Add Training
      </button>
    </div>
  );
}

function AcademicForm({ items, onChange }) {
  const add    = () => onChange(prev => [...prev, { qualification: '', institutionName: '', institutionAddress: '' }]);
  const remove = i  => onChange(prev => prev.filter((_, idx) => idx !== i));
  const upd    = (i, field) => e =>
    onChange(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: e.target.value } : item));
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-6">No academic records yet.</p>
      )}
      {items.map((a, i) => (
        <div key={i} className="bg-gray-50/60 border border-gray-100 rounded-lg p-3 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <Input label="Qualification"    value={a.qualification}      onChange={upd(i, 'qualification')} />
              <Input label="Institution Name" value={a.institutionName}    onChange={upd(i, 'institutionName')} />
              <div className="col-span-2">
                <Input label="Institution Address" value={a.institutionAddress} onChange={upd(i, 'institutionAddress')} />
              </div>
            </div>
            <button
              onClick={() => remove(i)}
              className="mt-5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-start"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Plus size={13} /> Add Academic Record
      </button>
    </div>
  );
}

function NomineeForm({ state, onChange }) {
  const upd = field => e => onChange(prev => ({ ...prev, [field]: e.target.value }));
  return (
    <div className="space-y-4">
      <div>
        <SubHeading>Basic Family Info</SubHeading>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input label="Father Name"     value={state.fatherName}   onChange={upd('fatherName')} />
          <Input label="Mother Name"     value={state.motherName}   onChange={upd('motherName')} />
          <Input label="Spouse Name"     value={state.spouseName}   onChange={upd('spouseName')} />
          <Input label="No. of Children" value={state.noOfChildren} onChange={upd('noOfChildren')} type="number" />
          <Input label="Spouse Age"      value={state.spouseAge}    onChange={upd('spouseAge')}   type="number" />
        </div>
      </div>
      <div>
        <SubHeading>Emergency Contact</SubHeading>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input label="Contact Person"  value={state.emergencyContactPerson}  onChange={upd('emergencyContactPerson')} />
          <Input label="Contact Number"  value={state.emergencyContactNumber}  onChange={upd('emergencyContactNumber')} />
          <div className="col-span-2">
            <Input label="Contact Address" value={state.emergencyContactAddress} onChange={upd('emergencyContactAddress')} />
          </div>
        </div>
      </div>
      <div>
        <SubHeading>Nominee</SubHeading>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input label="Name"     value={state.nomineeName}     onChange={upd('nomineeName')} />
          <Input label="Relation" value={state.nomineeRelation} onChange={upd('nomineeRelation')} />
          <div className="col-span-2">
            <Input label="Address" value={state.nomineeAddress} onChange={upd('nomineeAddress')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkDetailForm({ state, onChange }) {
  const upd = field => e => onChange(prev => ({ ...prev, [field]: e.target.value }));
  return (
    <div className="space-y-4">
      <div>
        <SubHeading>Visa Info</SubHeading>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input label="Visa No."         value={state.visaNumber}     onChange={upd('visaNumber')} />
          <Input label="Visa Issued Date" value={state.visaIssuedDate} onChange={upd('visaIssuedDate')} type="date" />
          <Input label="Visa Expiry Date" value={state.visaExpiryDate} onChange={upd('visaExpiryDate')} type="date" />
          <Input label="KDN / BPA No."    value={state.kdnBpaNo}       onChange={upd('kdnBpaNo')} />
        </div>
      </div>
      <div>
        <SubHeading>Branch Info</SubHeading>
        <div className="mt-3">
          <Input label="Branch" value={state.branchInfo} onChange={upd('branchInfo')} />
        </div>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function EditCandidateSectionModal({ isOpen, section, candidate, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);

  const [address, setAddress] = useState({
    permanent: { province: '', district: '', municipality: '', wardNo: '' },
    temporary: { province: '', district: '', municipality: '', address: '' },
  });
  const [bank,       setBank]       = useState({ bankName: '', accountNo: '', accountHolderName: '', relation: '' });
  const [training,   setTraining]   = useState([]);
  const [academic,   setAcademic]   = useState([]);
  const [nominee,    setNominee]    = useState({
    fatherName: '', motherName: '', spouseName: '', noOfChildren: 0, spouseAge: 0,
    emergencyContactPerson: '', emergencyContactNumber: '', emergencyContactAddress: '',
    nomineeName: '', nomineeRelation: '', nomineeAddress: '',
  });
  const [workDetail, setWorkDetail] = useState({
    visaNumber: '', visaIssuedDate: '', visaExpiryDate: '', kdnBpaNo: '', branchInfo: '',
  });

  useEffect(() => {
    if (!isOpen || !candidate) return;

    setAddress({
      permanent: {
        province:     candidate.permanentProvince     ?? '',
        district:     candidate.permanentDistrict     ?? '',
        municipality: candidate.permanentMunicipality ?? '',
        wardNo:       candidate.permanentWardNo       ?? '',
      },
      temporary: {
        province:     candidate.temporaryProvince     ?? '',
        district:     candidate.temporaryDistrict     ?? '',
        municipality: candidate.temporaryMunicipality ?? '',
        address:      candidate.temporaryAddress      ?? '',
      },
    });

    const b = candidate.bankInfo || {};
    setBank({
      bankName:          b.bankName          ?? '',
      accountNo:         b.accountNo         ?? '',
      accountHolderName: b.accountHolderName ?? '',
      relation:          b.relation          ?? '',
    });

    setTraining(candidate.training?.length ? candidate.training.map(t => ({ ...t })) : []);
    setAcademic(candidate.academic?.length ? candidate.academic.map(a => ({ ...a })) : []);

    const n = candidate.nomineeInfo || {};
    setNominee({
      fatherName:              n.fatherName              ?? '',
      motherName:              n.motherName              ?? '',
      spouseName:              n.spouseName              ?? '',
      noOfChildren:            n.noOfChildren            ?? 0,
      spouseAge:               n.spouseAge               ?? 0,
      emergencyContactPerson:  n.emergencyContactPerson  ?? '',
      emergencyContactNumber:  n.emergencyContactNumber  ?? '',
      emergencyContactAddress: n.emergencyContactAddress ?? '',
      nomineeName:             n.nomineeName             ?? '',
      nomineeRelation:         n.nomineeRelation         ?? '',
      nomineeAddress:          n.nomineeAddress          ?? '',
    });

    const toDateInput = d => d ? new Date(d).toISOString().split('T')[0] : '';
    setWorkDetail({
      visaNumber:     candidate.visaNumber     ?? '',
      visaIssuedDate: toDateInput(candidate.visaIssuedDate),
      visaExpiryDate: toDateInput(candidate.visaExpiryDate),
      kdnBpaNo:       candidate.kdnBpaNo       ?? '',
      branchInfo:     candidate.branchInfo     ?? '',
    });
  }, [isOpen, section, candidate]);

  const handleSave = async () => {
    if (!candidate?._id) return;
    setSaving(true);
    try {
      let payload = {};
      switch (section) {
        case 'address':
          payload = {
            permanentProvince:     address.permanent.province,
            permanentDistrict:     address.permanent.district,
            permanentMunicipality: address.permanent.municipality,
            permanentWardNo:       address.permanent.wardNo,
            temporaryProvince:     address.temporary.province,
            temporaryDistrict:     address.temporary.district,
            temporaryMunicipality: address.temporary.municipality,
            temporaryAddress:      address.temporary.address,
          };
          break;
        case 'bank':       payload = { bankInfo: bank };    break;
        case 'training':   payload = { training };          break;
        case 'academic':   payload = { academic };          break;
        case 'nominee':    payload = { nomineeInfo: nominee }; break;
        case 'workDetail': payload = { ...workDetail };    break;
      }
      await candidatesApi.updateProfileSection(candidate._id, payload);
      showToast.success('Saved successfully');
      onSuccess();
      onClose();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">{SECTION_TITLES[section]}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {section === 'address'    && <AddressForm    state={address}    onChange={setAddress}    />}
          {section === 'bank'       && <BankForm       state={bank}       onChange={setBank}       />}
          {section === 'training'   && <TrainingForm   items={training}   onChange={setTraining}   />}
          {section === 'academic'   && <AcademicForm   items={academic}   onChange={setAcademic}   />}
          {section === 'nominee'    && <NomineeForm    state={nominee}    onChange={setNominee}    />}
          {section === 'workDetail' && <WorkDetailForm state={workDetail} onChange={setWorkDetail} />}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
