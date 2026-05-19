import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, X, Eye, EyeOff, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const NewAgencyModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    agencyName: '', subdomain: '', adminName: '', adminEmail: '', adminPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    if (form.agencyName) {
      const suggested = form.agencyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
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
    if (!PWD_REGEX.test(form.adminPassword)) {
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
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Agency Details</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name *</label>
                <input type="text" name="agencyName" value={form.agencyName} onChange={handleChange}
                  placeholder="ABC Manpower Services"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain *</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                  <span className="inline-flex items-center px-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 whitespace-nowrap">
                    manpoweros.com/
                  </span>
                  <input type="text" name="subdomain" value={form.subdomain} onChange={handleChange}
                    placeholder="yourcompany"
                    className="flex-1 min-w-0 px-3 py-2.5 text-sm focus:outline-none"
                    required />
                </div>
                {form.subdomain && (
                  <p className="mt-1 text-xs text-primary font-medium">Preview: {form.subdomain}.manpoweros.com</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Initial Admin Account</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Full Name *</label>
                <input type="text" name="adminName" value={form.adminName} onChange={handleChange}
                  placeholder="Rajesh Sharma"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                <input type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange}
                  placeholder="admin@agency.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} name="adminPassword" value={form.adminPassword}
                    onChange={handleChange} placeholder="Min 8 chars, uppercase, number, special"
                    className={`w-full px-3 py-2.5 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${
                      pwdError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    required />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwdError && <p className="mt-1 text-xs text-red-600">{pwdError}</p>}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            The admin can log in immediately with these credentials and add staff from their dashboard.
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2">
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

export default NewAgencyModal;
