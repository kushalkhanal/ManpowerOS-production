import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { staffApi } from '../../api';
import { BSDatePicker } from '../ui/index.js';
import { ROLE_LABELS, STAFF_DEPARTMENTS as DEPARTMENTS, STAFF_DEFAULT_PERMISSIONS as DEFAULT_PERMISSIONS, PERMISSIONS_LIST } from '../../constants/roles';

const ROLE_TO_DEPT = {
  admin: 'management', manager: 'management',
  staff: 'operations', documentation: 'documentation', agent: 'field',
};

const INITIAL_FORM = {
  name: '', email: '', phone: '', role: 'agent', department: 'operations',
  joiningDate: null, salaryNPR: '', address: '', permissions: DEFAULT_PERMISSIONS.agent,
};

const StaffFormModal = ({ isOpen, onClose, editingStaff, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() =>
    editingStaff
      ? {
          name: editingStaff.name || '',
          email: editingStaff.email || '',
          phone: editingStaff.phone || '',
          role: editingStaff.role || 'agent',
          department: editingStaff.department || 'operations',
          joiningDate: editingStaff.joiningDate ? new Date(editingStaff.joiningDate) : null,
          salaryNPR: editingStaff.salaryNPR || '',
          address: editingStaff.address || '',
          permissions: editingStaff.permissions || DEFAULT_PERMISSIONS[editingStaff.role] || {},
        }
      : INITIAL_FORM
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'role' ? { department: ROLE_TO_DEPT[value] ?? prev.department, permissions: DEFAULT_PERMISSIONS[value] } : {}),
    }));
  };

  const handlePermissionChange = (key) =>
    setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('Name, phone and email are required');
      return;
    }
    try {
      if (editingStaff) {
        await staffApi.update(editingStaff._id, formData);
        toast.success('Staff updated');
        onSuccess();
      } else {
        const res = await staffApi.invite(formData);
        toast.success('Invite link generated');
        onSuccess(res.data.inviteLink);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save staff');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h3>

            <div className="flex border-b mb-4">
              {['Basic Info', 'Role & Dept', 'Permissions'].map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => setStep(idx + 1)}
                  className={`px-4 py-2 text-sm font-medium ${step === idx + 1 ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[['name', 'Name *', 'text'], ['phone', 'Phone *', 'text'], ['email', 'Email *', 'email'], ['address', 'Address', 'text']].map(([n, lbl, type]) => (
                    <div key={n}>
                      <label className="block text-sm font-medium text-gray-700">{lbl}</label>
                      <input type={type} name={n} value={formData[n]} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                  <BSDatePicker value={formData.joiningDate} onChange={(date) => setFormData(p => ({ ...p, joiningDate: date }))} placeholder="Select joining date" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <select name="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Salary (NPR)</label>
                    <input type="number" name="salaryNPR" value={formData.salaryNPR} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Permissions are based on role. You can customize them here.</p>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS_LIST.map(perm => (
                    <label key={perm.key} className="flex items-center">
                      <input type="checkbox" checked={formData.permissions[perm.key] || false} onChange={() => handlePermissionChange(perm.key)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm">Next</button>
            ) : (
              <button onClick={handleSubmit} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm">{editingStaff ? 'Update' : 'Create Staff'}</button>
            )}
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Back</button>
            )}
            <button onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffFormModal;
