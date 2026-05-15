export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  INTERVIEWER: 'interviewer',
  DATA_OPERATOR: 'data_operator',
  ACCOUNTANT: 'accountant'
};

export const ROLE_HIERARCHY = {
  superadmin: 6,
  admin: 5,
  manager: 4,
  interviewer: 3,
  data_operator: 2,
  accountant: 1
};

export const PERMISSIONS = {
  candidates: ['create', 'read', 'update', 'delete'],
  passports: ['create', 'read', 'update', 'delete'],
  medical: ['create', 'read', 'update', 'delete'],
  orientation: ['create', 'read', 'update', 'delete'],
  insurance: ['create', 'read', 'update', 'delete'],
  demands: ['create', 'read', 'update', 'delete'],
  fees: ['create', 'read', 'update', 'delete'],
  staff: ['create', 'read', 'update', 'delete'],
  tasks: ['create', 'read', 'update', 'delete'],
  alerts: ['read'],
  documents: ['create', 'read', 'update', 'delete'],
  settings: ['read', 'update'],
  reports: ['read']
};

export const ROLE_PERMISSIONS = {
  superadmin: Object.keys(PERMISSIONS),
  admin: Object.keys(PERMISSIONS),
  manager: ['candidates', 'passports', 'medical', 'orientation', 'insurance', 'demands', 'fees', 'tasks', 'alerts', 'documents', 'reports'],
  interviewer: ['candidates', 'medical', 'orientation'],
  data_operator: ['candidates', 'passports', 'medical', 'orientation', 'demands', 'tasks'],
  accountant: ['fees', 'reports']
};