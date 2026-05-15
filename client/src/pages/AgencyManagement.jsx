import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Search, MoreVertical, Power, CheckCircle, XCircle, Trash2, ArrowUpRight, ShieldCheck, UserPlus, X, Eye, EyeOff, Copy, Shield, Plus, CreditCard, Calendar } from 'lucide-react';
import superAdminApi from '../api/superAdmin.api';
import { authApi } from '../api/auth.api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ActionMenu = ({ agency, onToggleStatus, onDelete, onImpersonate, onCreateAdmin, onUpdatePlan }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setMenuPosition({
            top: rect.bottom + window.scrollY,
            left: rect.right - 200 + window.scrollX
          });
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 200 + window.scrollX
      });
    }
    setIsOpen(!isOpen);
  };

  const menuItems = (
    <div 
      ref={menuRef}
      style={{ 
        position: 'fixed', 
        top: `${menuPosition.top - window.scrollY}px`, 
        left: `${menuPosition.left - window.scrollX}px`,
        zIndex: 9999 
      }}
      className="w-52 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-fade-in"
    >
      <button
        onClick={() => { onImpersonate(agency._id); setIsOpen(false); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary-50 transition-colors font-medium"
      >
        <ShieldCheck size={14} />
        Login as Agency
      </button>

      <button
        onClick={() => { onCreateAdmin(agency); setIsOpen(false); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
      >
        <UserPlus size={14} />
        Create Admin Account
      </button>

      <button
        onClick={() => { onUpdatePlan(agency); setIsOpen(false); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors font-medium"
      >
        <CreditCard size={14} />
        Update Plan & Usage
      </button>

      <div className="border-t border-gray-100 my-1" />

      <button
        onClick={() => { window.open(`//${agency.subdomain}.manpoweros.com`, '_blank'); setIsOpen(false); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <ArrowUpRight size={14} />
        Visit Platform
      </button>

      <button
        onClick={() => { onToggleStatus(agency._id, agency.isActive); setIsOpen(false); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Power size={14} className={agency.isActive ? 'text-rose-500' : 'text-emerald-500'} />
        <span className={agency.isActive ? 'text-rose-600' : 'text-emerald-600'}>
          {agency.isActive ? 'Deactivate Agency' : 'Activate Agency'}
        </span>
      </button>

      <div className="border-t border-gray-100 my-1" />
      
      <button
        onClick={() => { onDelete(agency); setIsOpen(false); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
      >
        <Trash2 size={14} />
        Delete Permanently
      </button>
    </div>
  );

  return (
    <div className="relative">
      <button 
        ref={buttonRef}
        onClick={toggleMenu}
        className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-primary-100 text-primary' : 'hover:bg-gray-100 text-gray-500'}`}
      >
        <MoreVertical size={18} />
      </button>
      {isOpen && createPortal(menuItems, document.body)}
    </div>
  );
};

// ─── Create Admin Modal ────────────────────────────────────────────────────────
const CreateAdminModal = ({ agency, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setLoading(true);
    try {
      const res = await superAdminApi.createAdminForAgency(agency._id, form);
      const data = res.data?.data || res.data;
      setResult({ inviteLink: data.inviteLink, adminName: data.user?.name });
      toast.success('Admin account created successfully');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.inviteLink) {
      navigator.clipboard.writeText(result.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Shield size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create Admin Account</h2>
              <p className="text-xs text-gray-500">{agency.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
        {result ? (
          /* ── Success View ── */
          <div>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Admin Created!</h3>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{result.adminName}</strong> has been set up as admin for <strong>{agency.name}</strong>
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                Invite Link — valid for 48 hours
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-xs text-gray-700 bg-white border border-emerald-200 rounded-lg px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap">
                  {result.inviteLink}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600 flex-shrink-0"
                >
                  {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-xs text-emerald-700 mt-2">
                The admin will set their own password via this link. Account activates on first login.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form View ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700">
              <strong>Super Admin Action:</strong> This creates a new <em>Admin</em> account for this agency. Only Super Admins can perform this action.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@agency.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="98XXXXXXXX"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            <p className="text-xs text-gray-400">
              A secure invite link will be generated. The admin sets their own password via the link.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    Create Admin
                  </>
                )}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── New Agency Modal ─────────────────────────────────────────────────────────
const NewAgencyModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    agencyName: '', subdomain: '', adminName: '', adminEmail: '', adminPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // Auto-generate subdomain from agency name
  useEffect(() => {
    if (form.agencyName) {
      const suggested = form.agencyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      setForm(prev => ({ ...prev, subdomain: suggested }));
    }
  }, [form.agencyName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'subdomain') {
      setForm(prev => ({ ...prev, subdomain: value.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (name === 'adminPassword') setPwdError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwdRegex.test(form.adminPassword)) {
      setPwdError('Min 8 chars with uppercase, lowercase, number & special character (@$!%*?&)');
      return;
    }
    setLoading(true);
    try {
      await authApi.registerAgency(form);
      toast.success(`Agency "${form.agencyName}" created successfully!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create agency');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Building2 size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create New Agency</h2>
              <p className="text-xs text-gray-500">Set up a new agency on the platform</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Agency Details */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Agency Details</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name *</label>
                <input
                  type="text" name="agencyName" value={form.agencyName} onChange={handleChange}
                  placeholder="ABC Manpower Services"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain *</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                  <span className="inline-flex items-center px-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 whitespace-nowrap">
                    manpoweros.com/
                  </span>
                  <input
                    type="text" name="subdomain" value={form.subdomain} onChange={handleChange}
                    placeholder="yourcompany"
                    className="flex-1 min-w-0 px-3 py-2.5 text-sm focus:outline-none"
                    required
                  />
                </div>
                {form.subdomain && (
                  <p className="mt-1 text-xs text-primary font-medium">
                    Preview: {form.subdomain}.manpoweros.com
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Initial Admin Account</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Full Name *</label>
                <input
                  type="text" name="adminName" value={form.adminName} onChange={handleChange}
                  placeholder="Rajesh Sharma"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                <input
                  type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange}
                  placeholder="admin@agency.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    name="adminPassword" value={form.adminPassword} onChange={handleChange}
                    placeholder="Min 8 chars, uppercase, number, special"
                    className={`w-full px-3 py-2.5 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${
                      pwdError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwdError && <p className="mt-1 text-xs text-red-600">{pwdError}</p>}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            The admin will be able to log in immediately with these credentials and can add staff from their dashboard.
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</>
              ) : (
                <><Plus size={15} /> Create Agency</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ─── Edit Plan Modal ──────────────────────────────────────────────────────────
const EditPlanModal = ({ agency, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    plan: agency.plan || 'trial',
    planExpiresAt: agency.planExpiresAt ? new Date(agency.planExpiresAt).toISOString().split('T')[0] : ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await superAdminApi.updateAgencyPlan(agency._id, form);
      toast.success('Agency plan updated successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-modal-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <CreditCard size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Update Plan & Usage</h2>
              <p className="text-xs text-gray-500">{agency.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="trial">Trial Plan (Default)</option>
              <option value="basic">Basic Plan</option>
              <option value="pro">Pro Plan (High Usage)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Expiry Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={form.planExpiresAt}
                onChange={(e) => setForm({ ...form, planExpiresAt: e.target.value })}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400 italic font-medium">Leave empty for lifetime/perpetual access</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
            >
              {loading ? 'Updating...' : 'Update Plan Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AgencyManagement = () => {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createAdminTarget, setCreateAdminTarget] = useState(null);
  const [editPlanTarget, setEditPlanTarget] = useState(null);
  const [showNewAgency, setShowNewAgency] = useState(false);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const response = await superAdminApi.getAllAgencies();
      const agencyData = response.data?.data || response.data || [];
      setAgencies(Array.isArray(agencyData) ? agencyData : []);
    } catch (err) {
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
      setAgencies(agencies.map(a => a._id === id ? { ...a, isActive: newStatus } : a));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (agency) => {
    const confirmText = agency.name;
    const userInput = window.prompt(`CRITICAL ACTION: Are you sure you want to PERMANENTLY delete "${agency.name}"?\n\nThis will remove all associated users and data. This action CANNOT be undone.\n\nPlease type the agency name EXACTLY to confirm:`);
    
    if (userInput === confirmText) {
      try {
        await superAdminApi.deleteAgency(agency._id);
        toast.success('Agency deleted successfully');
        setAgencies(agencies.filter(a => a._id !== agency._id));
      } catch (err) {
        toast.error('Failed to delete agency');
      }
    } else if (userInput !== null) {
      toast.error('Confirmation mismatch. Deletion cancelled.');
    }
  };

  const handleImpersonate = async (agencyId) => {
    try {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        localStorage.setItem('admin_token', currentToken);
      }
      const { data } = await superAdminApi.impersonateAgency(agencyId);
      setSession(data);
      toast.success('Switched to Agency Workspace');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to impersonate agency');
    }
  };

  const filteredAgencies = agencies.filter(agency => 
    agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency Management</h1>
          <p className="text-sm text-gray-500">Monitor and manage all registered agencies on the platform</p>
        </div>
        <button
          onClick={() => setShowNewAgency(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm text-sm"
        >
          <Plus size={16} />
          New Agency
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or subdomain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Agency Profile</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan &amp; Usage</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">System Access</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">System Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                      <span className="text-sm text-gray-500">Loading agencies...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAgencies.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No agencies found.
                  </td>
                </tr>
              ) : (
                filteredAgencies.map((agency) => (
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary border border-primary-200 shadow-sm animate-fade-in">
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
                        onCreateAdmin={(a) => setCreateAdminTarget(a)}
                        onUpdatePlan={(a) => setEditPlanTarget(a)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {createAdminTarget && (
        <CreateAdminModal
          agency={createAdminTarget}
          onClose={() => setCreateAdminTarget(null)}
          onSuccess={fetchAgencies}
        />
      )}

      {/* New Agency Modal */}
      {showNewAgency && (
        <NewAgencyModal
          onClose={() => setShowNewAgency(false)}
          onSuccess={fetchAgencies}
        />
      )}

      {/* Edit Plan Modal */}
      {editPlanTarget && (
        <EditPlanModal
          agency={editPlanTarget}
          onClose={() => setEditPlanTarget(null)}
          onSuccess={fetchAgencies}
        />
      )}
    </div>
  );
};

export default AgencyManagement;
