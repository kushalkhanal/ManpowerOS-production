import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import superAdminApi from '../../api/superAdmin.api';

const EditPlanModal = ({ agency, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    plan: agency.plan || 'trial',
    planExpiresAt: agency.planExpiresAt ? new Date(agency.planExpiresAt).toISOString().split('T')[0] : '',
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
            <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
              <option value="trial">Trial Plan (Default)</option>
              <option value="basic">Basic Plan</option>
              <option value="pro">Pro Plan (High Usage)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Expiry Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="date" value={form.planExpiresAt}
                onChange={e => setForm(p => ({ ...p, planExpiresAt: e.target.value }))}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
            </div>
            <p className="mt-1 text-xs text-gray-400 italic font-medium">Leave empty for lifetime/perpetual access</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-700 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
              {loading ? 'Updating...' : 'Update Plan Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditPlanModal;
