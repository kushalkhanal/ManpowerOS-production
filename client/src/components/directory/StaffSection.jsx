import { useState, useEffect } from 'react';
import { staffApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { devError } from '../../utils/devLog';
import { toast } from 'react-hot-toast';
import { BSDatePicker } from '../ui/index.js';
import { ConfirmDialog } from '../ui';
import StaffCard from './StaffCard';

const DEPARTMENTS = ['management', 'operations', 'documentation', 'field'];

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  documentation: 'Documentation',
  agent: 'Agent'
};

const DEFAULT_PERMISSIONS = {
  admin: { canEditCandidates: true, canDeleteCandidates: true, canViewFinance: true, canExportData: true, canManageStaff: true, canSendAlerts: true, canViewAuditLog: true },
  manager: { canEditCandidates: true, canDeleteCandidates: false, canViewFinance: true, canExportData: true, canManageStaff: false, canSendAlerts: true, canViewAuditLog: false },
  staff: { canEditCandidates: true, canDeleteCandidates: false, canViewFinance: false, canExportData: false, canManageStaff: false, canSendAlerts: false, canViewAuditLog: false },
  documentation: { canEditCandidates: true, canDeleteCandidates: false, canViewFinance: false, canExportData: true, canManageStaff: false, canSendAlerts: false, canViewAuditLog: false },
  agent: { canEditCandidates: false, canDeleteCandidates: false, canViewFinance: false, canExportData: false, canManageStaff: false, canSendAlerts: false, canViewAuditLog: false }
};

const PERMISSIONS_LIST = [
  { key: 'canEditCandidates', label: 'Edit Candidates' },
  { key: 'canDeleteCandidates', label: 'Delete Candidates' },
  { key: 'canViewFinance', label: 'View Finance' },
  { key: 'canExportData', label: 'Export Data' },
  { key: 'canManageStaff', label: 'Manage Staff' },
  { key: 'canSendAlerts', label: 'Send Alerts' },
  { key: 'canViewAuditLog', label: 'View Audit Log' }
];

const StaffSection = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [step, setStep] = useState(1);
  const [inviteLink, setInviteLink] = useState(null);
  const [resetPasswordTargetId, setResetPasswordTargetId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: 'agent', department: 'operations',
    joiningDate: null, salaryNPR: '', address: '', permissions: DEFAULT_PERMISSIONS.agent
  });

  useEffect(() => {
    loadStaff();
    checkOnline();
    const interval = setInterval(checkOnline, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const response = await staffApi.getAll({ limit: 50 });
      setStaff(response.data.data || []);
    } catch (err) {
      devError('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkOnline = async () => {
    try {
      const response = await fetch('/api/staff/online', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setOnlineCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      devError('Failed to check online:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const roleToDept = {
      admin: 'management',
      manager: 'management',
      staff: 'operations',
      documentation: 'documentation',
      agent: 'field'
    };
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      department: name === 'role' ? roleToDept[value] : prev.department,
      permissions: name === 'role' ? DEFAULT_PERMISSIONS[value] : prev.permissions
    }));
  };

  const handlePermissionChange = (permKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [permKey]: !prev.permissions[permKey] }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      toast.error('Name, phone and email are required');
      return;
    }
    try {
      const res = await staffApi.invite(formData);
      setInviteLink(res.data.inviteLink);
      toast.success('Invite link generated');
      loadStaff();
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create staff');
    }
  };

  const handleUpdate = async () => {
    if (!editingStaff) return;
    try {
      await staffApi.update(editingStaff._id, formData);
      toast.success('Staff updated');
      setShowModal(false);
      setEditingStaff(null);
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update staff');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordTargetId) return;
    try {
      const res = await staffApi.resetPassword(resetPasswordTargetId);
      setInviteLink(res.data.resetLink);
      toast.success('Reset link generated');
      setResetPasswordTargetId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await staffApi.delete(deleteTargetId);
      toast.success('Staff deleted');
      setDeleteTargetId(null);
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete staff');
      setDeleteTargetId(null);
    }
  };

  const handleToggle = async (id) => {
    try {
      await staffApi.toggle(id);
      toast.success('Status updated');
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const openEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'agent',
      department: member.department || 'operations',
      joiningDate: member.joiningDate ? new Date(member.joiningDate) : null,
      salaryNPR: member.salaryNPR || '',
      address: member.address || '',
      permissions: member.permissions || DEFAULT_PERMISSIONS[member.role] || {}
    });
    setStep(1);
    setShowModal(true);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormData({
      name: '', email: '', phone: '', role: 'agent', department: 'operations',
      joiningDate: null, salaryNPR: '', address: '', permissions: DEFAULT_PERMISSIONS.agent
    });
    setStep(1);
  };

  const filteredStaff = staff.filter(s => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(searchLower) ||
      s.role?.toLowerCase().includes(searchLower) ||
      s.department?.toLowerCase().includes(searchLower)
    );
  });

  const activeStaffCount = staff.filter(s => s.isActive !== false).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Our Staff ({activeStaffCount})
          </h2>
          {onlineCount > 0 && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {onlineCount} online now
            </p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
          >
            + Add Staff
          </button>
        )}
      </div>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Search by name, role, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No staff found</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredStaff.map(member => (
              <StaffCard
                key={member._id}
                staff={member}
                onEdit={isAdmin ? openEdit : null}
                onResetPassword={isAdmin ? () => setResetPasswordTargetId(member._id) : null}
                onToggle={isAdmin ? () => handleToggle(member._id) : null}
                onDelete={isAdmin ? () => setDeleteTargetId(member._id) : null}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => { setShowModal(false); setEditingStaff(null); }} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingStaff ? 'Edit Staff' : 'Add New Staff'}
                </h3>

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
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone *</label>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                      <BSDatePicker
                        value={formData.joiningDate}
                        onChange={(date) => setFormData(p => ({ ...p, joiningDate: date }))}
                        placeholder="Select joining date"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Salary (NPR)</label>
                        <input
                          type="number"
                          name="salaryNPR"
                          value={formData.salaryNPR}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Permissions are based on role. You can customize them here.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {PERMISSIONS_LIST.map(perm => (
                        <label key={perm.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions[perm.key] || false}
                            onChange={() => handlePermissionChange(perm.key)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={editingStaff ? handleUpdate : handleSubmit}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingStaff ? 'Update' : 'Create Staff'}
                  </button>
                )}
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => { setShowModal(false); setEditingStaff(null); }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {inviteLink && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setInviteLink(null)} />
            <div className="relative bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-left">
              <h3 className="text-lg font-medium text-gray-900 mb-1">Invite Link Ready</h3>
              <p className="text-sm text-gray-500 mb-3">Share this link with the staff member. It expires in 48 hours.</p>
              <div className="bg-gray-50 border border-gray-200 p-2 rounded font-mono text-xs break-all mb-3">{inviteLink}</div>
              <button
                onClick={() => { navigator.clipboard.writeText(inviteLink); }}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium mb-2"
              >
                Copy Link
              </button>
              <button
                onClick={() => setInviteLink(null)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(resetPasswordTargetId)}
        title="Reset Staff Password"
        message="Are you sure you want to reset password for this staff account?"
        confirmLabel="Reset Password"
        confirmVariant="warning"
        onCancel={() => setResetPasswordTargetId(null)}
        onConfirm={handleResetPassword}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Staff Member"
        message="Are you sure you want to permanently delete this staff member? This cannot be undone. Staff with assigned candidates cannot be deleted."
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default StaffSection;