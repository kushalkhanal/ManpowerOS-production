// Single source of truth for all role/permission/department constants on the client.

export const ROLES = {
  SUPERADMIN:    'superadmin',
  ADMIN:         'admin',
  MANAGER:       'manager',
  STAFF:         'staff',
  DOCUMENTATION: 'documentation',
  AGENT:         'agent',
};

export const ROLE_LABELS = {
  superadmin:    'Super Admin',
  admin:         'Admin',
  manager:       'Manager',
  staff:         'Staff',
  documentation: 'Documentation',
  agent:         'Agent',
};

export const STAFF_DEPARTMENTS = ['management', 'operations', 'documentation', 'field'];

// Staff permission keys and their display labels
export const PERMISSIONS_LIST = [
  { key: 'canEditCandidates',   label: 'Edit Candidates' },
  { key: 'canDeleteCandidates', label: 'Delete Candidates' },
  { key: 'canViewFinance',      label: 'View Finance' },
  { key: 'canExportData',       label: 'Export Data' },
  { key: 'canManageStaff',      label: 'Manage Staff' },
  { key: 'canSendAlerts',       label: 'Send Alerts' },
  { key: 'canViewAuditLog',     label: 'View Audit Log' },
];

export const STAFF_DEFAULT_PERMISSIONS = {
  admin: {
    canEditCandidates: true, canDeleteCandidates: true, canViewFinance: true,
    canExportData: true, canManageStaff: true, canSendAlerts: true, canViewAuditLog: true,
  },
  manager: {
    canEditCandidates: true, canDeleteCandidates: false, canViewFinance: true,
    canExportData: true, canManageStaff: false, canSendAlerts: true, canViewAuditLog: false,
  },
  staff: {
    canEditCandidates: true, canDeleteCandidates: false, canViewFinance: false,
    canExportData: false, canManageStaff: false, canSendAlerts: false, canViewAuditLog: false,
  },
  documentation: {
    canEditCandidates: true, canDeleteCandidates: false, canViewFinance: false,
    canExportData: true, canManageStaff: false, canSendAlerts: false, canViewAuditLog: false,
  },
  agent: {
    canEditCandidates: false, canDeleteCandidates: false, canViewFinance: false,
    canExportData: false, canManageStaff: false, canSendAlerts: false, canViewAuditLog: false,
  },
};

// Sponsor/agent roles and their default permissions
export const SPONSOR_ROLES = ['agent', 'senior_agent', 'partner', 'coordinator', 'manager'];

export const SPONSOR_ROLE_DEFAULT_PERMISSIONS = {
  agent:        ['canViewOwnCandidates'],
  senior_agent: ['canReferCandidates', 'canViewOwnCandidates', 'canViewAllCandidates'],
  partner:      ['canReferCandidates', 'canViewAllCandidates', 'canExportCandidates'],
  coordinator:  ['canReferCandidates', 'canViewAllCandidates', 'canEditOwnCandidates'],
  manager:      ['canReferCandidates', 'canViewAllCandidates', 'canEditOwnCandidates', 'canExportCandidates'],
};

// Sponsor active/passive/blacklisted status display
export const AGENT_STATUS = [
  { value: 'active',      label: 'Active',      cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'passive',     label: 'Passive',     cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'blacklisted', label: 'Blacklisted', cls: 'bg-red-100 text-red-800 border-red-200' },
];

export default ROLES;
