import { useState, useEffect } from 'react';
import { useParams, Route, Routes, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useStaff } from '../hooks/useStaff';
import { useDepartments } from '../hooks/useDepartments';
import { showToast } from '../components/ToastProvider';
import { DESIRED_COUNTRIES, USER_ROLES, PLAN_LIMITS, ALERT_TYPES } from '../utils/constants';
import {
  Building2,
  Wallet,
  Users,
  Bell,
  CreditCard,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Folder,
  Eye,
  FileJson,
  History,
  Shield
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui';

const SettingsTabs = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const tabs = [
    { id: 'profile',       label: 'Profile',       href: '/settings/profile',       icon: Building2 },
    { id: 'departments',   label: 'Departments',   href: '/settings/departments',   icon: Folder },
    { id: 'fees',          label: 'Service Fees',  href: '/settings/fees',          icon: Wallet },
    { id: 'staff',         label: 'Staff',         href: '/settings/staff',         icon: Users },
    { id: 'notifications', label: 'Alerts',        href: '/settings/notifications', icon: Bell },
    { id: 'permissions',   label: 'Permissions',   href: '/settings/permissions',   icon: Shield },
    { id: 'audit',         label: 'Audit Log',     href: '/settings/audit',         icon: History },
    { id: 'export',        label: 'Export',        href: '/settings/export',        icon: FileJson },
    { id: 'backup',        label: 'Backup',        href: '/settings/backup',        icon: Eye },
    { id: 'plan',          label: 'Plan',          href: '/settings/plan',          icon: CreditCard },
  ];

  // Fix: check user.role, not agency.role (agency object has no role field)
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const visibleTabs = isAdmin ? tabs : tabs.filter(t => ['profile'].includes(t.id));

  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-gray-200">
      {visibleTabs.map(tab => {
        const Icon = tab.icon;
        const active = isActive(tab.href) || (location.pathname === '/settings' && tab.id === 'profile');
        return (
          // Fix: use <Link to> instead of <a href> — avoids full page reload
          <Link
            key={tab.id}
            to={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

const ProfileSettings = () => {
  const { settings, getSettings, updateSettings, loading } = useSettings();
  const { agency } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    nameNepali: '',
    dofeLicenseNumber: '',
    dofeLicenseExpiry: '',
    phone: '',
    website: '',
    logo: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        nameNepali: settings.settings?.nameNepali || '',
        dofeLicenseNumber: settings.settings?.dofeLicenseNumber || '',
        dofeLicenseExpiry: settings.settings?.dofeLicenseExpiry?.split('T')[0] || '',
        phone: settings.settings?.phone || '',
        website: settings.settings?.website || '',
        logo: settings.settings?.logo || '',
        street: settings.settings?.address?.street || '',
        city: settings.settings?.address?.city || '',
        state: settings.settings?.address?.state || '',
        zipCode: settings.settings?.address?.zipCode || '',
        country: settings.settings?.address?.country || ''
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        name: formData.name,
        settings: {
          nameNepali: formData.nameNepali,
          dofeLicenseNumber: formData.dofeLicenseNumber,
          dofeLicenseExpiry: formData.dofeLicenseExpiry,
          phone: formData.phone,
          website: formData.website,
          logo: formData.logo,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          }
        }
      });
      showToast.success('Settings saved');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const daysUntilExpiry = formData.dofeLicenseExpiry
    ? Math.ceil((new Date(formData.dofeLicenseExpiry) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 60 && daysUntilExpiry > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agency Profile</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Agency Name (English)</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Agency Name (नेपाली)</label>
            <input type="text" name="nameNepali" value={formData.nameNepali} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DoFE License Number</label>
            <input type="text" name="dofeLicenseNumber" value={formData.dofeLicenseNumber} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DoFE License Expiry</label>
            <input type="date" name="dofeLicenseExpiry" value={formData.dofeLicenseExpiry} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
            {isExpiringSoon && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Expires in {daysUntilExpiry} days
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <input type="text" name="website" value={formData.website} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="https://" />
          </div>
        </div>

        <h3 className="text-md font-medium text-gray-900 mt-6 mb-3">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Street</label>
            <input type="text" name="street" value={formData.street} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State/Province</label>
            <input type="text" name="state" value={formData.state} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
            <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input type="text" name="country" value={formData.country} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
        <Save size={16} />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

const FeeSettings = () => {
  const { settings, getSettings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings();
  }, []);

  useEffect(() => {
    if (settings?.settings?.serviceFeeDefaults) {
      const fees = {};
      const defaults = settings.settings.serviceFeeDefaults;
      // Safety: Handle both Map (if it arrives as one) and plain Object
      // In SPAs, Maps from API usually arrive as plain objects after JSON.parse
      if (defaults && typeof defaults.forEach === 'function') {
        defaults.forEach((value, key) => { fees[key] = value; });
      } else if (defaults) {
        Object.entries(defaults).forEach(([key, value]) => {
          fees[key] = value;
        });
      }
      setFormData(fees);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const serviceFeeDefaults = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value) serviceFeeDefaults[key] = parseInt(value) || 0;
      });
      await updateSettings({
        settings: { serviceFeeDefaults }
      });
      showToast.success('Service fees saved');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Default Service Fees</h2>
        <p className="text-sm text-gray-500 mb-4">Set default service fees per country. These pre-fill when registering new candidates.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DESIRED_COUNTRIES.map(country => (
            <div key={country}>
              <label className="block text-sm font-medium text-gray-700">{country}</label>
              <input type="number" name={country} value={formData[country] || ''} onChange={handleChange}
                placeholder="NPR 0"
                className="mt-1 w-full px-3 py-2 border rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
        <Save size={16} />
        {saving ? 'Saving...' : 'Save Fees'}
      </button>
    </form>
  );
};

const DepartmentSettings = () => {
  const { departments, getDepartments, createDepartment, updateDepartment, deleteDepartment, loading, error } = useDepartments();
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#6366f1' });
  const [saving, setSaving] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6'];

  useEffect(() => {
    getDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingDept) {
        await updateDepartment(editingDept._id, formData);
        showToast.success('Department updated');
      } else {
        await createDepartment(formData);
        showToast.success('Department created');
      }
      setShowForm(false);
      setEditingDept(null);
      setFormData({ name: '', description: '', color: '#6366f1' });
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, description: dept.description || '', color: dept.color || '#6366f1' });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;
    try {
      await deleteDepartment(departmentToDelete);
      showToast.success('Department deleted');
      setDepartmentToDelete(null);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
        <button onClick={() => { setShowForm(true); setEditingDept(null); setFormData({ name: '', description: '', color: '#6366f1' }); }}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm">
          <Plus size={16} /> Add Department
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="Department name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <div className="flex gap-2 mt-1">
                {colors.map(c => (
                  <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, color: c }))}
                    className={`w-8 h-8 rounded-full ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input type="text" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border rounded-lg" placeholder="Optional description" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg">
              {saving ? 'Saving...' : editingDept ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingDept(null); }}
              className="px-4 py-2 border rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : !Array.isArray(departments) || departments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No departments yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <div key={dept._id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                <h3 className="font-medium text-gray-900">{dept.name}</h3>
              </div>
              {dept.description && <p className="text-sm text-gray-500 mb-2">{dept.description}</p>}
              <div className="flex gap-2 mt-2 pt-2 border-t">
                <button onClick={() => handleEdit(dept)} className="text-sm text-primary-600 hover:underline">Edit</button>
                <button onClick={() => setDepartmentToDelete(dept._id)} className="text-sm text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(departmentToDelete)}
        title="Delete Department"
        message="Delete this department? This action cannot be undone."
        confirmLabel="Delete Department"
        confirmVariant="danger"
        onCancel={() => setDepartmentToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

const PermissionSettings = () => {
  const roles = [
    { id: 'admin', name: 'Admin', permissions: ['canEditCandidates', 'canDeleteCandidates', 'canViewFinance', 'canExportData', 'canManageStaff', 'canSendAlerts', 'canViewAuditLog'] },
    { id: 'manager', name: 'Manager', permissions: ['canEditCandidates', 'canDeleteCandidates', 'canViewFinance', 'canExportData', 'canManageStaff', 'canSendAlerts', 'canViewAuditLog'] },
    { id: 'staff', name: 'Staff', permissions: ['canEditCandidates'] },
    { id: 'documentation', name: 'Documentation', permissions: ['canEditCandidates', 'canDeleteCandidates', 'canViewFinance', 'canExportData'] },
    { id: 'agent', name: 'Agent', permissions: [] }
  ];

  const allPermissions = [
    { key: 'canEditCandidates', label: 'Edit Candidates' },
    { key: 'canDeleteCandidates', label: 'Delete Candidates' },
    { key: 'canViewFinance', label: 'View Finance' },
    { key: 'canExportData', label: 'Export Data' },
    { key: 'canManageStaff', label: 'Manage Staff' },
    { key: 'canSendAlerts', label: 'Send Alerts' },
    { key: 'canViewAuditLog', label: 'View Audit Log' }
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-900">Role Permissions</h2>
      <p className="text-sm text-gray-500">View the permissions assigned to each role.</p>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
              {roles.map(role => (
                <th key={role.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{role.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allPermissions.map(perm => (
              <tr key={perm.key}>
                <td className="px-4 py-3 text-sm text-gray-900">{perm.label}</td>
                {roles.map(role => (
                  <td key={role.id} className="px-4 py-3">
                    {role.permissions.includes(perm.key) ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExportSettings = () => {
  const { settings, getSettings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    defaultFormat: 'csv',
    includePhotos: false,
    dateFormat: 'BS'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings();
  }, []);

  useEffect(() => {
    if (settings?.settings?.exportPreferences) {
      setFormData(prev => ({ ...prev, ...settings.settings.exportPreferences }));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({ settings: { exportPreferences: formData } });
      showToast.success('Export settings saved');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900">Export Settings</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Default Format</label>
        <select value={formData.defaultFormat} onChange={e => setFormData(p => ({ ...p, defaultFormat: e.target.value }))}
          className="mt-1 w-full px-3 py-2 border rounded-lg">
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="json">JSON</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Date Format</label>
        <select value={formData.dateFormat} onChange={e => setFormData(p => ({ ...p, dateFormat: e.target.value }))}
          className="mt-1 w-full px-3 py-2 border rounded-lg">
          <option value="BS">Buddhist Sambat (Nepali)</option>
          <option value="AD">AD (English)</option>
        </select>
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={formData.includePhotos} onChange={e => setFormData(p => ({ ...p, includePhotos: e.target.checked }))}
          className="rounded border-gray-300" />
        <span className="text-sm text-gray-700">Include Photos in Export</span>
      </label>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
        <Save size={16} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
};

const AuditLogSettings = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
      <p className="text-sm text-gray-500">View all system activity here. Requires permission to access.</p>
      
      <div className="bg-white rounded-lg border p-8 text-center">
        <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-4">Audit log feature coming soon.</p>
        <p className="text-sm text-gray-400">This will show all create, update, and delete operations.</p>
      </div>
    </div>
  );
};

const BackupSettings = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      showToast.success('Export started. Download will begin shortly.');
    } catch (err) {
      showToast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900">Backup & Export</h2>
      
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-medium text-gray-900 mb-2">Export All Data</h3>
        <p className="text-sm text-gray-500 mb-4">Download all your agency data as JSON. This includes candidates, staff, sponsors, and more.</p>
        
        <button onClick={handleExport} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
          <Eye size={16} />
          {loading ? 'Exporting...' : 'Download Data'}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          Note: Full database backup is performed weekly. Contact support for custom backup schedules.
        </p>
      </div>
    </div>
  );
};

const StaffSettings = () => {
  const { users, getUsers, inviteUser, updateUser, toggleUser, loading } = useStaff();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'agent' });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState(null);
  const [userToDeactivate, setUserToDeactivate] = useState(null);

  useEffect(() => {
    getUsers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      const result = await inviteUser(inviteData);
      if (result?.inviteLink) {
        navigator.clipboard.writeText(result.inviteLink).catch(() => {});
        showToast.success('Invite link copied to clipboard — share it with the staff member');
      } else {
        showToast.success('User invited successfully');
      }
      setShowInvite(false);
      setInviteData({ name: '', email: '', role: 'agent' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole });
      showToast.success('Role updated');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await toggleUser(userToDeactivate);
      showToast.success('User deactivated');
      setUserToDeactivate(null);
    } catch (err) {
      showToast.error(err.message || 'Failed to deactivate');
    }
  };

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
            <input type="text" placeholder="Name" value={inviteData.name} onChange={e => setInviteData(p => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 border rounded-lg" required />
            <input type="email" placeholder="Email" value={inviteData.email} onChange={e => setInviteData(p => ({ ...p, email: e.target.value }))}
              className="px-3 py-2 border rounded-lg" required />
            <select value={inviteData.role} onChange={e => setInviteData(p => ({ ...p, role: e.target.value }))}
              className="px-3 py-2 border rounded-lg">
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="documentation">Documentation</option>
              <option value="agent">Agent</option>
            </select>
            <button type="submit" disabled={inviting}
              className="px-4 py-2 bg-primary text-white rounded-lg">
              {inviting ? 'Inviting...' : 'Send Invite'}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                <td className="px-4 py-3">
                  <select value={user.role} onChange={e => handleRoleChange(user._id, e.target.value)}
                    className="text-sm border rounded px-2 py-1">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="documentation">Documentation</option>
                    <option value="agent">Agent</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {user.isActive && (
                    <button onClick={() => setUserToDeactivate(user._id)}
                      className="text-red-600 hover:text-red-800 text-sm">
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

const NotificationSettings = () => {
  const { settings, getSettings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    passportExpiryDays: 60,
    medicalExpiryDays: 30,
    demandExpiryDays: 14,
    swukritiExpiryDays: 14,
    insuranceExpiryDays: 30,
    enabledAlertTypes: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings();
  }, []);

  useEffect(() => {
    if (settings?.settings?.notificationPreferences) {
      setFormData({
        ...formData,
        ...settings.settings.notificationPreferences
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAlertTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      enabledAlertTypes: prev.enabledAlertTypes.includes(type)
        ? prev.enabledAlertTypes.filter(t => t !== type)
        : [...prev.enabledAlertTypes, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        settings: { notificationPreferences: formData }
      });
      showToast.success('Notification settings saved');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Preferences</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Passport Expiry Warning (days)</label>
            <select name="passportExpiryDays" value={formData.passportExpiryDays} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg">
              <option value={30}>30 days</option>
              <option value={45}>45 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Medical Expiry Warning (days)</label>
            <select name="medicalExpiryDays" value={formData.medicalExpiryDays} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg">
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={45}>45 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Demand Expiry Warning (days)</label>
            <select name="demandExpiryDays" value={formData.demandExpiryDays} onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg">
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
        </div>

        <h3 className="text-md font-medium text-gray-900 mb-3">Enabled Alert Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALERT_TYPES.map(type => (
            <label key={type.value} className="flex items-center gap-2">
              <input type="checkbox" checked={formData.enabledAlertTypes.includes(type.value)}
                onChange={() => handleAlertTypeToggle(type.value)}
                className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">
        <Save size={16} />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
};

const PlanSettings = () => {
  const { usage, getUsage } = useSettings();
  const { agency } = useAuth();

  useEffect(() => {
    getUsage();
  }, []);

  const plan = agency?.plan || 'trial';
  const limits = PLAN_LIMITS[plan];
  const daysRemaining = usage?.daysRemaining;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-2xl font-bold text-primary">{limits.name}</p>
            {plan === 'trial' && daysRemaining !== null && (
              <p className="text-sm text-amber-600">{daysRemaining} days remaining</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold">
              {limits.price === 0 ? 'Free' : `NPR ${limits.price}/mo`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Candidates</p>
            <p className="text-lg font-semibold">
              {usage?.usage?.candidateCount || 0} / {limits.candidates || '∞'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Users</p>
            <p className="text-lg font-semibold">
              {usage?.usage?.userCount || 0} / {limits.users || '∞'}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-md font-medium text-gray-900 mb-2">Plan Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {limits.candidates || 'Unlimited'} candidates</li>
            <li>• {limits.users || 'Unlimited'} team members</li>
            <li>• Full access to all features</li>
          </ul>
        </div>

        {plan !== 'pro' && (
          <button className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600">
            Upgrade to {plan === 'trial' ? 'Basic' : 'Pro'}
          </button>
        )}
      </div>
    </div>
  );
};

const Settings = () => {
  const { activeTab } = useParams();

  return (
    <div className="px-4 py-6 sm:px-0">
      <SettingsTabs />
      
      <Routes>
        <Route index element={<ProfileSettings />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="departments" element={<DepartmentSettings />} />
        <Route path="fees" element={<FeeSettings />} />
        <Route path="staff" element={<StaffSettings />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="permissions" element={<PermissionSettings />} />
        <Route path="audit" element={<AuditLogSettings />} />
        <Route path="export" element={<ExportSettings />} />
        <Route path="backup" element={<BackupSettings />} />
        <Route path="plan" element={<PlanSettings />} />
      </Routes>
    </div>
  );
};

export default Settings;