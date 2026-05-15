import { useState, useEffect } from 'react';
import { useStaff } from '../hooks/useStaff';
import { showToast } from './ToastProvider';
import { USER_ROLES, ROLE_COLORS, DEPARTMENT_OPTIONS, PERMISSION_LABELS } from '../utils/constants';
import { X, User, Phone, Mail, Calendar, DollarSign, Shield, CheckSquare, FileText, Users } from 'lucide-react';

const StaffDetailModal = ({ isOpen, onClose, userId, onSuccess }) => {
  const { getUserById, getUserActivity, getUserCandidates, updateUser, loading } = useStaff();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen && userId) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    const userData = await getUserById(userId);
    setUser(userData);
    setFormData({
      name: userData.name,
      phone: userData.phone || '',
      address: userData.address || '',
      department: userData.department || '',
      salaryNPR: userData.salaryNPR || '',
      role: userData.role
    });
    
    const activityData = await getUserActivity(userId);
    setActivities(activityData || []);
    
    const candidateData = await getUserCandidates(userId);
    setCandidates(candidateData || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions?.[permission]
      }
    }));
  };

  const handleSave = async () => {
    try {
      await updateUser(userId, formData);
      showToast.success('Staff updated successfully');
      setEditing(false);
      onSuccess?.();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff < 1) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  if (!isOpen || !user) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'activity', label: 'Activity', icon: FileText },
    { id: 'candidates', label: 'Candidates', icon: Users }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 my-8 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              {user.photo ? (
                <img src={user.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="text-primary font-medium">{user.name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded ${ROLE_COLORS[user.role]}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    disabled={!editing}
                    className="mt-1 w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="role" value={formData.role} onChange={handleChange}
                    disabled={!editing}
                    className="mt-1 w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
                  >
                    {USER_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text" name="phone" value={formData.phone} onChange={handleChange}
                    disabled={!editing}
                    className="mt-1 w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    name="department" value={formData.department} onChange={handleChange}
                    disabled={!editing}
                    className="mt-1 w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
                  >
                    <option value="">Select</option>
                    {DEPARTMENT_OPTIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary (NPR)</label>
                  <input
                    type="number" name="salaryNPR" value={formData.salaryNPR} onChange={handleChange}
                    disabled={!editing}
                    className="mt-1 w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <p className="mt-1 text-gray-500">{formatDate(user.lastLoginAt)}</p>
                </div>
              </div>

              {editing && (
                <div className="flex gap-2 pt-4">
                  <button onClick={handleSave} disabled={loading}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600">
                    Save Changes
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="px-4 py-2 border rounded-lg">
                    Cancel
                  </button>
                </div>
              )}
              
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Edit Profile
                </button>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={user.permissions?.[key] || false}
                    onChange={() => handlePermissionChange(key)}
                    disabled={!editing}
                    className="rounded border-gray-300"
                  />
                </label>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity</p>
              ) : (
                activities.map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{activity.action || 'Action'}</p>
                      <p className="text-xs text-gray-500">{activity.details}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-2">
              {candidates.length === 0 ? (
                <p className="text-gray-500 text-sm">No assigned candidates</p>
              ) : (
                candidates.map(candidate => (
                  <a key={candidate._id} href={`/candidates/${candidate._id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div>
                      <p className="text-sm font-medium">{candidate.fullName}</p>
                      <p className="text-xs text-gray-500">{candidate.phone}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      candidate.status === 'departed' ? 'bg-green-100 text-green-800' :
                      candidate.status === 'registered' ? 'bg-gray-100 text-gray-800' :
                      'bg-primary-100 text-primary-800'
                    }`}>
                      {candidate.status}
                    </span>
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDetailModal;