import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2, Search, MoreVertical, Power, CheckCircle, XCircle,
  Trash2, ArrowUpRight, ShieldCheck, UserPlus, CreditCard, Calendar, Plus,
} from 'lucide-react';
import superAdminApi from '../api/superAdmin.api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateAdminModal from '../components/superAdmin/CreateAdminModal';
import NewAgencyModal   from '../components/superAdmin/NewAgencyModal';
import EditPlanModal    from '../components/superAdmin/EditPlanModal';

const ActionMenu = ({ agency, onToggleStatus, onDelete, onImpersonate, onCreateAdmin, onUpdatePlan }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.right - 200 + window.scrollX });
      }
    };

    updatePosition();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.right - 200 + window.scrollX });
    }
    setIsOpen(v => !v);
  };

  const close = (fn, ...args) => { fn(...args); setIsOpen(false); };

  const menuItems = (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: `${menuPosition.top - window.scrollY}px`, left: `${menuPosition.left - window.scrollX}px`, zIndex: 9999 }}
      className="w-52 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-fade-in"
    >
      <button onClick={() => close(onImpersonate, agency._id)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary-50 transition-colors font-medium">
        <ShieldCheck size={14} /> Login as Agency
      </button>
      <button onClick={() => close(onCreateAdmin, agency)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium">
        <UserPlus size={14} /> Create Admin Account
      </button>
      <button onClick={() => close(onUpdatePlan, agency)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors font-medium">
        <CreditCard size={14} /> Update Plan & Usage
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button onClick={() => { window.open(`//${agency.subdomain}.manpoweros.com`, '_blank'); setIsOpen(false); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <ArrowUpRight size={14} /> Visit Platform
      </button>
      <button onClick={() => close(onToggleStatus, agency._id, agency.isActive)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <Power size={14} className={agency.isActive ? 'text-rose-500' : 'text-emerald-500'} />
        <span className={agency.isActive ? 'text-rose-600' : 'text-emerald-600'}>
          {agency.isActive ? 'Deactivate Agency' : 'Activate Agency'}
        </span>
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button onClick={() => close(onDelete, agency)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium">
        <Trash2 size={14} /> Delete Permanently
      </button>
    </div>
  );

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={toggleMenu}
        className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-primary-100 text-primary' : 'hover:bg-gray-100 text-gray-500'}`}>
        <MoreVertical size={18} />
      </button>
      {isOpen && createPortal(menuItems, document.body)}
    </div>
  );
};

const AgencyManagement = () => {
  const { setSession, token } = useAuth();
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createAdminTarget, setCreateAdminTarget] = useState(null);
  const [editPlanTarget, setEditPlanTarget] = useState(null);
  const [showNewAgency, setShowNewAgency] = useState(false);

  useEffect(() => { fetchAgencies(); }, []);

  const fetchAgencies = async () => {
    try {
      const response = await superAdminApi.getAllAgencies();
      const data = response.data?.data || response.data || [];
      setAgencies(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      await superAdminApi.updateAgencyStatus(id, newStatus);
      toast.success(`Agency ${newStatus ? 'activated' : 'deactivated'}`);
      setAgencies(prev => prev.map(a => a._id === id ? { ...a, isActive: newStatus } : a));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (agency) => {
    const userInput = window.prompt(
      `CRITICAL: Permanently delete "${agency.name}"?\n\nThis removes all users and data and CANNOT be undone.\n\nType the agency name EXACTLY to confirm:`
    );
    if (userInput === agency.name) {
      try {
        await superAdminApi.deleteAgency(agency._id);
        toast.success('Agency deleted successfully');
        setAgencies(prev => prev.filter(a => a._id !== agency._id));
      } catch {
        toast.error('Failed to delete agency');
      }
    } else if (userInput !== null) {
      toast.error('Confirmation mismatch. Deletion cancelled.');
    }
  };

  const handleImpersonate = async (agencyId) => {
    try {
      // Save current superadmin token so user can return to superadmin session
      if (token) localStorage.setItem('admin_token', token);
      const { data } = await superAdminApi.impersonateAgency(agencyId);
      setSession(data);
      toast.success('Switched to Agency Workspace');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to impersonate agency');
    }
  };

  const filtered = agencies.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency Management</h1>
          <p className="text-sm text-gray-500">Monitor and manage all registered agencies on the platform</p>
        </div>
        <button onClick={() => setShowNewAgency(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm text-sm">
          <Plus size={16} /> New Agency
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by name or subdomain..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition-all shadow-sm" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Agency Profile', 'Plan & Usage', 'System Access', 'System Status', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
                      <span className="text-sm text-gray-500">Loading agencies...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No agencies found.</td>
                </tr>
              ) : filtered.map(agency => (
                <tr key={agency._id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary-200">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{agency.name}</div>
                        <div className="text-xs text-gray-500 font-medium">{agency.subdomain}.manpoweros.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-700 uppercase tracking-wider">
                        {agency.plan || 'trial'}
                      </span>
                      {agency.planExpiresAt && (
                        <div className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <Calendar size={10} />
                          Exp: {new Date(agency.planExpiresAt).toLocaleDateString()}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 font-medium">
                        {agency.userCount} <span className="text-gray-400">Users</span> • {agency.candidateCount} <span className="text-gray-400">Candidates</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{agency.adminCount || 0}</span>
                        <span className="text-xs text-gray-500">Admins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{agency.staffCount || 0}</span>
                        <span className="text-xs text-gray-500">Staff Members</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {agency.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary border border-primary-200 shadow-sm">
                        <CheckCircle size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200 shadow-sm opacity-70">
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionMenu
                      agency={agency}
                      onToggleStatus={toggleStatus}
                      onDelete={handleDelete}
                      onImpersonate={handleImpersonate}
                      onCreateAdmin={setCreateAdminTarget}
                      onUpdatePlan={setEditPlanTarget}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createAdminTarget && (
        <CreateAdminModal agency={createAdminTarget} onClose={() => setCreateAdminTarget(null)} onSuccess={fetchAgencies} />
      )}
      {showNewAgency && (
        <NewAgencyModal onClose={() => setShowNewAgency(false)} onSuccess={fetchAgencies} />
      )}
      {editPlanTarget && (
        <EditPlanModal agency={editPlanTarget} onClose={() => setEditPlanTarget(null)} onSuccess={fetchAgencies} />
      )}
    </div>
  );
};

export default AgencyManagement;
