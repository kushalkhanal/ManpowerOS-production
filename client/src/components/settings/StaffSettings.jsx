import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { showToast } from '../ToastProvider';
import { ConfirmDialog } from '../ui';
import { useStaff, useInviteUser, useUpdateStaff } from '../../hooks/queries';

const StaffSettings = () => {
  const { data, isLoading } = useStaff({ limit: 100 });
  const users = data?.data || [];
  const inviteMutation = useInviteUser();
  const updateMutation = useUpdateStaff();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'agent' });
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [error, setError] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await inviteMutation.mutateAsync(inviteData);
      const link = res.data?.inviteLink;
      if (link) {
        navigator.clipboard.writeText(link).catch(() => {});
        showToast.success('Invite link copied to clipboard — share it with the staff member');
      } else {
        showToast.success('User invited successfully');
      }
      setShowInvite(false);
      setInviteData({ name: '', email: '', role: 'agent' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateMutation.mutateAsync({ id: userId, data: { role } });
      showToast.success('Role updated');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await updateMutation.mutateAsync({ id: userToDeactivate, data: { isActive: false } });
      showToast.success('User deactivated');
      setUserToDeactivate(null);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to deactivate');
    }
  };

  if (isLoading) return <div className="text-gray-500">Loading staff...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm">
          <Plus size={16} /> Invite User
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {showInvite && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
            <input type="text" placeholder="Name" value={inviteData.name}
              onChange={e => setInviteData(p => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 border rounded-lg" required />
            <input type="email" placeholder="Email" value={inviteData.email}
              onChange={e => setInviteData(p => ({ ...p, email: e.target.value }))}
              className="px-3 py-2 border rounded-lg" required />
            <select value={inviteData.role}
              onChange={e => setInviteData(p => ({ ...p, role: e.target.value }))}
              className="px-3 py-2 border rounded-lg">
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="documentation">Documentation</option>
              <option value="agent">Agent</option>
            </select>
            <button type="submit" disabled={inviteMutation.isPending}
              className="px-4 py-2 bg-primary text-white rounded-lg">
              {inviteMutation.isPending ? 'Inviting...' : 'Send Invite'}
            </button>
            <button type="button" onClick={() => setShowInvite(false)}
              className="px-4 py-2 border rounded-lg">Cancel</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Email', 'Role', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                <td className="px-4 py-3">
                  <select value={user.role}
                    onChange={e => handleRoleChange(user._id, e.target.value)}
                    className="text-sm border rounded px-2 py-1">
                    {['admin', 'manager', 'staff', 'documentation', 'agent'].map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {user.isActive && (
                    <button onClick={() => setUserToDeactivate(user._id)}
                      className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={Boolean(userToDeactivate)}
        title="Deactivate User"
        message="Are you sure you want to deactivate this user account?"
        confirmLabel="Deactivate"
        confirmVariant="warning"
        onCancel={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivate}
      />
    </div>
  );
};

export default StaffSettings;
