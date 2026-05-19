import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, X, Trash2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import superAdminApi from '../../api/superAdmin.api';

const ManageAdminsModal = ({ agency, onClose }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.listAgencyAdmins(agency._id);
      const data = res.data?.data || res.data || [];
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [agency._id]);

  const handleDelete = async (admin) => {
    const ok = window.confirm(
      `Delete admin "${admin.name}" (${admin.email})?\n\nThis cannot be undone.`
    );
    if (!ok) return;
    setDeletingId(admin._id);
    try {
      await superAdminApi.deleteAgencyAdmin(agency._id, admin._id);
      toast.success('Admin deleted');
      setAdmins(prev => prev.filter(a => a._id !== admin._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete admin');
    } finally {
      setDeletingId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col animate-modal-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Manage Admins</h2>
              <p className="text-xs text-gray-500">{agency.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">
              No admin accounts found for this agency.
            </div>
          ) : (
            <div className="space-y-2">
              {admins.map(admin => (
                <div key={admin._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 truncate">{admin.name}</span>
                      {admin.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                          <XCircle size={10} /> Disabled
                        </span>
                      )}
                      {admin.mustChangePassword && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldAlert size={10} /> Pending First Login
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{admin.email}</div>
                    {admin.phone && <div className="text-xs text-gray-400">{admin.phone}</div>}
                    <div className="text-[10px] text-gray-400 mt-1">
                      Created {new Date(admin.createdAt).toLocaleDateString()}
                      {admin.lastLoginAt && <> • Last login {new Date(admin.lastLoginAt).toLocaleDateString()}</>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(admin)}
                    disabled={deletingId === admin._id}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {deletingId === admin._id ? (
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-rose-500 border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ManageAdminsModal;
