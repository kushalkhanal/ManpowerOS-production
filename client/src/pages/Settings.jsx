import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Wallet, Users, Bell, CreditCard,
  Folder, FileJson, History, Eye, Shield,
} from 'lucide-react';

import ProfileSettings      from '../components/settings/ProfileSettings';
import FeeSettings          from '../components/settings/FeeSettings';
import DepartmentSettings   from '../components/settings/DepartmentSettings';
import PermissionSettings   from '../components/settings/PermissionSettings';
import ExportSettings       from '../components/settings/ExportSettings';
import AuditLogSettings     from '../components/settings/AuditLogSettings';
import BackupSettings       from '../components/settings/BackupSettings';
import StaffSettings        from '../components/settings/StaffSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import PlanSettings         from '../components/settings/PlanSettings';

const TABS = [
  { id: 'profile',       label: 'Profile',      href: '/settings/profile',       icon: Building2 },
  { id: 'departments',   label: 'Departments',  href: '/settings/departments',   icon: Folder },
  { id: 'fees',          label: 'Service Fees', href: '/settings/fees',          icon: Wallet },
  { id: 'staff',         label: 'Staff',        href: '/settings/staff',         icon: Users },
  { id: 'notifications', label: 'Alerts',       href: '/settings/notifications', icon: Bell },
  { id: 'permissions',   label: 'Permissions',  href: '/settings/permissions',   icon: Shield },
  { id: 'audit',         label: 'Audit Log',    href: '/settings/audit',         icon: History },
  { id: 'export',        label: 'Export',       href: '/settings/export',        icon: FileJson },
  { id: 'backup',        label: 'Backup',       href: '/settings/backup',        icon: Eye },
  { id: 'plan',          label: 'Plan',         href: '/settings/plan',          icon: CreditCard },
];

const SettingsTabs = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const visible = isAdmin ? TABS : TABS.filter(t => t.id === 'profile');

  return (
    <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-gray-200">
      {visible.map(tab => {
        const Icon = tab.icon;
        const active = location.pathname === tab.href || location.pathname.startsWith(tab.href + '/') ||
          (location.pathname === '/settings' && tab.id === 'profile');
        return (
          <Link key={tab.id} to={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              active ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}>
            <Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

const Settings = () => (
  <div className="px-4 py-6 sm:px-0">
    <SettingsTabs />
    <Routes>
      <Route index element={<ProfileSettings />} />
      <Route path="profile"       element={<ProfileSettings />} />
      <Route path="departments"   element={<DepartmentSettings />} />
      <Route path="fees"          element={<FeeSettings />} />
      <Route path="staff"         element={<StaffSettings />} />
      <Route path="notifications" element={<NotificationSettings />} />
      <Route path="permissions"   element={<PermissionSettings />} />
      <Route path="audit"         element={<AuditLogSettings />} />
      <Route path="export"        element={<ExportSettings />} />
      <Route path="backup"        element={<BackupSettings />} />
      <Route path="plan"          element={<PlanSettings />} />
    </Routes>
  </div>
);

export default Settings;
