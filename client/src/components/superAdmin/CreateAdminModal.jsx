import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, X, CheckCircle, Copy, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import superAdminApi from '../../api/superAdmin.api';

const CreateAdminModal = ({ agency, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
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
                  <button onClick={handleCopy}
                    className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600 flex-shrink-0">
                    {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-emerald-700 mt-2">
                  Account activates on first login via this link.
                </p>
              </div>

              <button onClick={onClose}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700">
                <strong>Super Admin Action:</strong> Creates a new Admin account for this agency.
              </div>

              {[['name', 'Full Name *', 'text', 'e.g. Rajesh Sharma'], ['email', 'Email Address *', 'email', 'admin@agency.com']].map(([n, lbl, type, ph]) => (
                <div key={n}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{lbl}</label>
                  <input type={type} name={n} value={form[n]} onChange={handleChange} placeholder={ph}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="98XXXXXXXX"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
              </div>

              <p className="text-xs text-gray-400">A secure invite link will be generated. The admin sets their own password via the link.</p>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? (
                    <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Creating...</>
                  ) : (
                    <><UserPlus size={15} /> Create Admin</>
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

export default CreateAdminModal;
