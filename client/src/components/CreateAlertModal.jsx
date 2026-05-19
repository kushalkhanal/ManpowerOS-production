import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { alertsApi } from '../api/alerts.api';
import { staffApi } from '../api';
import { devError } from '../utils/devLog';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'agent', label: 'Agent' }
];

const CreateAlertModal = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [targetType, setTargetType] = useState('all');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingLoading, setSendingLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStaff();
      setMessage('');
      setSeverity('info');
      setTargetType('all');
      setSelectedRoles([]);
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const loadStaff = async () => {
    try {
      const res = await staffApi.getAll({ limit: 100 });
      setStaffList(res.data.data || []);
    } catch (err) {
      devError('Failed to load staff:', err);
    }
  };

  const handleRoleToggle = (role) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (targetType === 'roles' && selectedRoles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    if (targetType === 'users' && selectedUsers.length === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    try {
      setSendingLoading(true);
      
      let targetRoles = [];
      let targetUsers = [];

      if (targetType === 'all') {
        targetRoles = ['all'];
      } else if (targetType === 'roles') {
        targetRoles = selectedRoles;
      } else if (targetType === 'users') {
        targetUsers = selectedUsers;
      }

      await alertsApi.create({
        message: message.trim(),
        severity,
        targetRoles,
        targetUsers
      });

      toast.success('Alert sent successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send alert');
    } finally {
      setSendingLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Alert</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Enter alert message..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <div className="flex gap-2 mt-1">
                  {[
                    { value: 'info', label: 'Info', color: 'bg-primary-500' },
                    { value: 'warning', label: 'Warning', color: 'bg-amber-500' },
                    { value: 'critical', label: 'Critical', color: 'bg-red-500' }
                  ].map(sev => (
                    <button
                      key={sev.value}
                      onClick={() => setSeverity(sev.value)}
                      className={`flex-1 px-3 py-2 rounded-md text-white text-sm font-medium ${
                        severity === sev.value ? sev.color : 'bg-gray-300'
                      }`}
                    >
                      {sev.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'all'}
                      onChange={() => setTargetType('all')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">All Staff</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'roles'}
                      onChange={() => setTargetType('roles')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">By Role</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'users'}
                      onChange={() => setTargetType('users')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Specific Staff</span>
                  </label>
                </div>
              </div>

              {targetType === 'roles' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(role => (
                      <button
                        key={role.value}
                        onClick={() => handleRoleToggle(role.value)}
                        className={`px-3 py-1.5 text-sm rounded-full border ${
                          selectedRoles.includes(role.value)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {targetType === 'users' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                    {staffList.map(staff => (
                      <label
                        key={staff._id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(staff._id)}
                          onChange={() => handleUserToggle(staff._id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{staff.name}</span>
                        <span className="ml-1 text-xs text-gray-500">({staff.role})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSubmit}
              disabled={sendingLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {sendingLoading ? 'Sending...' : 'Send Alert'}
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

export default CreateAlertModal;