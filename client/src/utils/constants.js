// Sourced from workflow.js — single source of truth for statuses.
export { STATUS_COLORS, STATUS_LABELS } from '../constants/workflow.js';

export const COUNTRY_FLAGS = {
  'Qatar': '🇶🇦',
  'Saudi Arabia': '🇸🇦',
  'UAE': '🇦🇪',
  'Kuwait': '🇰🇼',
  'Malaysia': '🇲🇾',
  'Bahrain': '🇧🇭',
  'Oman': '🇴🇲',
  'South Korea': '🇰🇷',
  'Japan': '🇯🇵',
  'Israel': '🇮🇱',
  'Poland': '🇵🇱',
  'Romania': '🇷🇴',
  'Croatia': '🇭🇷',
  'Other': '🌍'
};

export const DESIRED_COUNTRIES = [
  'Qatar', 'Saudi Arabia', 'UAE', 'Kuwait', 'Malaysia', 'Bahrain', 'Oman',
  'South Korea', 'Japan', 'Israel', 'Poland', 'Romania', 'Croatia', 'Other'
];

export const EDUCATION_LEVELS = [
  { value: 'illiterate', label: 'Illiterate' },
  { value: 'primary', label: 'Primary Education' },
  { value: 'slc', label: 'SLC/SEE' },
  { value: 'plus2', label: '+2/Intermediate' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master & Above' }
];

export const PREDEFINED_SKILLS = [
  'General Labor', 'Construction', 'Plumbing', 'Electrical', 'Carpentry',
  'Masonry', 'Painting', 'Welding', 'Mechanical', 'Automotive',
  'Housekeeping', 'Cook', 'Chef', 'Waiter', 'Bartender',
  'Security Guard', 'Driver', 'Helper', 'Machine Operator',
  'Tailoring', 'Textile', 'Agriculture', 'Livestock', 'Fishery'
];

export const NEPAL_PROVINCES = [
  'Koshi Province', 'Madhesh Province', 'Bagmati Province', 'Gandaki Province',
  'Lumbini Province', 'Karnali Province', 'Sudurpashchim Province'
];

export const NEPAL_PROVINCES_WITH_HQ = [
  { name: 'Koshi Province', HQ: 'Biratnagar', districts: 14 },
  { name: 'Madhesh Province', HQ: 'Janakpur', districts: 8 },
  { name: 'Bagmati Province', HQ: 'Hetauda', districts: 13 },
  { name: 'Gandaki Province', HQ: 'Pokhara', districts: 11 },
  { name: 'Lumbini Province', HQ: 'Butwal', districts: 12 },
  { name: 'Karnali Province', HQ: 'Birendranagar', districts: 10 },
  { name: 'Sudurpashchim Province', HQ: 'Godawari', districts: 9 }
];

export const NEPAL_DISTRICTS_BY_PROVINCE = {
  'Koshi Province': [
    'Taplejung', 'Panchthar', 'Ilam', 'Jhapa', 'Morang', 'Sunsari', 'Dhankuta', 
    'Terhathum', 'Sankhuwasabha', 'Bhojpur', 'Solukhumbu', 'Okhaldhunga', 'Khotang', 'Udayapur'
  ],
  'Madhesh Province': [
    'Saptari', 'Siraha', 'Dhanusha', 'Mahottari', 'Sarlahi', 'Rautahat', 'Bara', 'Parsa'
  ],
  'Bagmati Province': [
    'Dolakha', 'Sindhupalchok', 'Rasuwa', 'Nuwakot', 'Dhading', 'Makwanpur', 
    'Chitwan', 'Kavrepalanchok', 'Lalitpur', 'Bhaktapur', 'Kathmandu', 'Sindhuli', 'Ramechhap'
  ],
  'Gandaki Province': [
    'Gorkha', 'Manang', 'Mustang', 'Myagdi', 'Kaski', 'Lamjung', 'Tanahu', 'Nawalpur', 'Syangja', 'Parbat', 'Baglung'
  ],
  'Lumbini Province': [
    'Rukum (East)', 'Rolpa', 'Pyuthan', 'Gulmi', 'Arghakhanchi', 'Palpa', 
    'Nawalparasi (East)', 'Rupandehi', 'Kapilvastu', 'Dang', 'Banke', 'Bardiya'
  ],
  'Karnali Province': [
    'Dolpa', 'Mugu', 'Humla', 'Jumla', 'Kalikot', 'Dailekh', 'Jajarkot', 'Rukum (West)', 'Salyan', 'Surkhet'
  ],
  'Sudurpashchim Province': [
    'Bajura', 'Bajhang', 'Darchula', 'Baitadi', 'Dadeldhura', 'Doti', 'Achham', 'Kailali', 'Kanchanpur'
  ]
};

export const NEPAL_DISTRICTS = [
  'Achham', 'Arghakhanchi', 'Baglung', 'Baitadi', 'Bajhang', 'Bajura', 'Banke', 'Bara',
  'Bardiya', 'Bhaktapur', 'Chitwan', 'Dadeldhura', 'Dailekh', 'Dang', 'Darchula',
  'Dhading', 'Dhankuta', 'Dhanusa', 'Dolpa', 'Doti', 'Gorkha', 'Gulmi', 'Humla',
  'Ilam', 'Jajarkot', 'Jhapa', 'Jumla', 'Kailali', 'Kalikot', 'Kanchanpur', 'Kapilvastu',
  'Kaski', 'Kathmandu', 'Kavrepalanchok', 'Khotang', 'Lalitpur', 'Lamjung', 'Mahottari',
  'Makwanpur', 'Manang', 'Morang', 'Mugu', 'Mustang', 'Myagdi', 'Nawalparasi (East)',
  'Nuwakot', 'Okhaldhunga', 'Palpa', 'Panchthar', 'Parsa', 'Parbat', 'Pyuthan',
  'Ramechhap', 'Rautahat', 'Rolpa', 'Rukum (East)', 'Rukum (West)', 'Rupandehi', 'Salyan', 
  'Sankhuwasabha', 'Saptari', 'Sindhuli', 'Sindhupalchok', 'Solukhumbu', 'Sunsari', 
  'Surkhet', 'Syangja', 'Tanahu', 'Taplejung', 'Terhathum', 'Udayapur'
];

export const PAYMENT_STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-800'
};

export const PAYMENT_STATUS_LABELS = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
  refunded: 'Refunded'
};

export const ORIENTATION_STATUS_COLORS = {
  scheduled: 'bg-primary-100 text-primary-800',
  completed: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  failed: 'bg-gray-100 text-gray-800'
};

export const ORIENTATION_STATUS_LABELS = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  absent: 'Absent',
  failed: 'Failed'
};

export const ORIENTATION_FEE = 700;

export const INSURANCE_DEFAULT_PREMIUM = 1674;
export const SSF_DEFAULT_CONTRIBUTION = 2595;

export const INSURANCE_STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  partially_done: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800'
};

export const INSURANCE_STATUS_LABELS = {
  pending: 'Pending',
  partially_done: 'Partially Done',
  completed: 'Completed'
};

export const DEMAND_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  filled: 'bg-primary-100 text-primary-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

export const DEMAND_STATUS_LABELS = {
  active: 'Active',
  filled: 'Filled',
  expired: 'Expired',
  cancelled: 'Cancelled'
};

export const JOB_CATEGORIES = [
  'Construction Worker', 'Cleaner', 'Caregiver', 'Driver', 'Cook',
  'Welder', 'Mason', 'Helper', 'Electrician', 'Plumber',
  'Mechanic', 'Tailor', 'Security Guard', 'Housekeeper', 'Nurse',
  'Technician', 'Operator', 'Supervisor', 'Manager', 'Other'
];

export const TRANSACTION_TYPES = [
  { value: 'service_fee', label: 'Service Fee' },
  { value: 'medical_fee', label: 'Medical Fee' },
  { value: 'orientation_fee', label: 'Orientation Fee' },
  { value: 'insurance_fee', label: 'Insurance Fee' },
  { value: 'ssf_fee', label: 'SSF Fee' },
  { value: 'visa_fee', label: 'Visa Fee' },
  { value: 'ticket_expense', label: 'Ticket Expense' },
  { value: 'miscellaneous', label: 'Miscellaneous' }
];

export const TRANSACTION_DIRECTION = [
  { value: 'received', label: 'Received' },
  { value: 'paid', label: 'Paid' }
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' }
];

export const DEFAULT_SERVICE_FEE_MIN = 70000;
export const DEFAULT_SERVICE_FEE_MAX = 100000;
export const NEPAL_MINIMUM_WAGE = 19550;
export const USD_TO_NPR = 130;

export const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'agent', label: 'Agent' }
];

export const PLAN_LIMITS = {
  trial: { name: 'Trial', candidates: 20, users: 1, price: 0, trialDays: 14 },
  basic: { name: 'Basic', candidates: 200, users: 5, price: 2000 },
  pro: { name: 'Pro', candidates: null, users: null, price: 5000 }
};

export const ALERT_TYPES = [
  { value: 'passport_expiring', label: 'Passport Expiring' },
  { value: 'medical_expiring', label: 'Medical Expiring' },
  { value: 'demand_expiring', label: 'Demand Expiring' },
  { value: 'swukriti_expiring', label: 'Swukriti Expiring' },
  { value: 'medical_failed', label: 'Medical Failed' },
  { value: 'process_stalled', label: 'Process Stalled' },
  { value: 'fee_outstanding', label: 'Outstanding Fee' },
  { value: 'orientation_missing', label: 'Orientation Missing' },
  { value: 'insurance_expiring', label: 'Insurance Expiring' },
  { value: 'dofe_license_expiring', label: 'DoFE License Expiring' }
];

export const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-teal-100 text-teal-800',
  documentation: 'bg-primary-100 text-primary-800',
  accounts: 'bg-amber-100 text-amber-800',
  agent: 'bg-green-100 text-green-800'
};

export const DEPARTMENT_OPTIONS = [
  { value: 'management', label: 'Management' },
  { value: 'operations', label: 'Operations' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'field', label: 'Field' }
];

export const PERMISSION_LABELS = {
  canEditCandidates: 'Edit Candidates',
  canDeleteCandidates: 'Delete Candidates',
  canViewFinance: 'View Finance',
  canExportData: 'Export Data',
  canManageStaff: 'Manage Staff',
  canSendAlerts: 'Send Alerts',
  canViewAuditLog: 'View Audit Log'
};

export const TASK_STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-primary-100 text-primary-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const TASK_STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const TASK_PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-primary-100 text-primary-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export const TASK_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

export const TASK_TYPES = [
  { value: 'document_collection', label: 'Document Collection' },
  { value: 'medical', label: 'Medical' },
  { value: 'orientation', label: 'Orientation' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'visa', label: 'Visa' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'police_clearance', label: 'Police Clearance' },
  { value: 'training', label: 'Training' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'other', label: 'Other' }
];

export const DOCUMENT_CATEGORIES = [
  { value: 'license', label: 'License', icon: 'FileBadge' },
  { value: 'contract', label: 'Contract', icon: 'FileSignature' },
  { value: 'template', label: 'Template', icon: 'FileText' },
  { value: 'legal', label: 'Legal', icon: 'Scale' },
  { value: 'financial', label: 'Financial', icon: 'DollarSign' },
  { value: 'training', label: 'Training', icon: 'GraduationCap' },
  { value: 'marketing', label: 'Marketing', icon: 'Megaphone' },
  { value: 'correspondence', label: 'Correspondence', icon: 'Mail' },
  { value: 'other', label: 'Other', icon: 'File' }
];

export const FILE_TYPE_ICONS = {
  pdf: { icon: 'FileText', color: 'text-red-600', bg: 'bg-red-50' },
  doc: { icon: 'FileText', color: 'text-primary-600', bg: 'bg-primary-50' },
  docx: { icon: 'FileText', color: 'text-primary-600', bg: 'bg-primary-50' },
  xls: { icon: 'FileSpreadsheet', color: 'text-green-600', bg: 'bg-green-50' },
  xlsx: { icon: 'FileSpreadsheet', color: 'text-green-600', bg: 'bg-green-50' },
  jpg: { icon: 'Image', color: 'text-purple-600', bg: 'bg-purple-50' },
  jpeg: { icon: 'Image', color: 'text-purple-600', bg: 'bg-purple-50' },
  png: { icon: 'Image', color: 'text-purple-600', bg: 'bg-purple-50' },
  gif: { icon: 'Image', color: 'text-purple-600', bg: 'bg-purple-50' },
  webp: { icon: 'Image', color: 'text-purple-600', bg: 'bg-purple-50' }
};

export const DOCUMENT_CATEGORY_COLORS = {
  license: 'bg-purple-100 text-purple-800',
  contract: 'bg-primary-100 text-primary-800',
  template: 'bg-cyan-100 text-cyan-800',
  legal: 'bg-primary-100 text-primary-800',
  financial: 'bg-green-100 text-green-800',
  training: 'bg-amber-100 text-amber-800',
  marketing: 'bg-pink-100 text-pink-800',
  correspondence: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-800'
};