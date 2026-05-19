import { useState, useEffect } from 'react';
import { staffApi } from '../../api';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { devError } from '../../utils/devLog';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../ui';
import StaffCard from './StaffCard';
import StaffFormModal from './StaffFormModal';

const InviteLinkDialog = ({ link, onClose }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4 text-center">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-left">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Invite Link Ready</h3>
        <p className="text-sm text-gray-500 mb-3">Share this link with the staff member. It expires in 48 hours.</p>
        <div className="bg-gray-50 border border-gray-200 p-2 rounded font-mono text-xs break-all mb-3">{link}</div>
        <button onClick={() => navigator.clipboard.writeText(link)} className="w-full px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium mb-2">Copy Link</button>
        <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 rounded text-sm">Done</button>
      </div>
    </div>
  </div>
);

const StaffSection = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [inviteLink, setInviteLink] = useState(null);
  const [resetTargetId, setResetTargetId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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
      const response = await api.get('/staff/online');
      setOnlineCount(Array.isArray(response.data) ? response.data.length : 0);
    } catch (err) {
      devError('Failed to check online:', err);
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

  const handleResetPassword = async () => {
    if (!resetTargetId) return;
    try {
      const res = await staffApi.resetPassword(resetTargetId);
      setInviteLink(res.data.resetLink);
      toast.success('Reset link generated');
      setResetTargetId(null);
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

  const openEdit = (member) => { setEditingStaff(member); setShowModal(true); };
  const openAdd = () => { setEditingStaff(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingStaff(null); };

  const handleFormSuccess = (link) => {
    loadStaff();
    if (link) setInviteLink(link);
  };

  const filteredStaff = staff.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q);
  });

  const activeCount = staff.filter(s => s.isActive !== false).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Our Staff ({activeCount})</h2>
          {onlineCount > 0 && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              {onlineCount} online now
            </p>
          )}
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
            + Add Staff
          </button>
        )}
      </div>

      <div className="mb-3">
        <input type="text" placeholder="Search by name, role, department..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">Loading...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No staff found</div>
        ) : (
          <div className="grid gap-3">
            {filteredStaff.map(member => (
              <StaffCard
                key={member._id}
                staff={member}
                onEdit={isAdmin ? openEdit : null}
                onResetPassword={isAdmin ? () => setResetTargetId(member._id) : null}
                onToggle={isAdmin ? () => handleToggle(member._id) : null}
                onDelete={isAdmin ? () => setDeleteTargetId(member._id) : null}
              />
            ))}
          </div>
        )}
      </div>

      <StaffFormModal isOpen={showModal} onClose={closeModal} editingStaff={editingStaff} onSuccess={handleFormSuccess} />

      {inviteLink && <InviteLinkDialog link={inviteLink} onClose={() => setInviteLink(null)} />}

      <ConfirmDialog
        isOpen={Boolean(resetTargetId)}
        title="Reset Staff Password"
        message="Are you sure you want to reset password for this staff account?"
        confirmLabel="Reset Password"
        confirmVariant="warning"
        onCancel={() => setResetTargetId(null)}
        onConfirm={handleResetPassword}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Staff Member"
        message="Are you sure you want to permanently delete this staff member? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default StaffSection;
