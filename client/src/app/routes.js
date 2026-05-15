import {
  LayoutDashboard,
  Users,
  BookOpen,
  Briefcase,
  Wallet,
  Bell,
  Settings,
  ShieldCheck,
  Building2,
  Globe,
  Sun,
  Tag,
  Stethoscope,
  GraduationCap,
  FileText,
  CheckSquare,
  UsersRound,
  Home
} from 'lucide-react';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import TodayDashboard from '../pages/v2/TodayDashboard';
import ChangePassword from '../pages/ChangePassword';
import CandidateList from '../pages/CandidateList';
import CandidateWorkspacePage from '../pages/v2/CandidateWorkspacePage';
import DirectoryPage from '../pages/DirectoryPage';
import PassportList from '../pages/PassportList';
import PassportDetail from '../pages/PassportDetail';
import PassportScanner from '../components/modules/PassportScanner';
import DemandList from '../pages/DemandList';
import DemandDetail from '../pages/DemandDetail';
import Finance from '../pages/Finance';
import Alerts from '../pages/Alerts';
import Documents from '../pages/Documents';
import Settings from '../pages/Settings';
import SuperAdminDashboard from '../pages/SuperAdminDashboard';
import AgencyManagement from '../pages/AgencyManagement';
import FeimsSubmissionCenter from '../pages/v2/FeimsSubmissionCenter';
import GulfVisaBoard from '../pages/v2/GulfVisaBoard';
import MalaysiaPlksBoard from '../pages/v2/MalaysiaPlksBoard';
import MedicalBoard from '../pages/v2/MedicalBoard';
import OrientationBoard from '../pages/v2/OrientationBoard';
import SetPasswordPage from '../pages/SetPasswordPage';
import PrintBiodata from '../pages/v2/print/PrintBiodata';
import PrintFeimsPacket from '../pages/v2/print/PrintFeimsPacket';
import PrintDeparture from '../pages/v2/print/PrintDeparture';

export const routeDefinitions = [
  {
    key: 'login',
    path: '/login',
    element: <Login />,
    public: true,
    layout: false,
  },
  {
    key: 'setPassword',
    path: '/set-password',
    element: <SetPasswordPage />,
    public: true,
    layout: false,
  },
  {
    key: 'dashboard',
    path: '/dashboard',
    element: <TodayDashboard />,
    label: 'Dashboard',
    icon: LayoutDashboard,
    sidebar: true,
  },
  {
    key: 'classicDashboard',
    path: '/dashboard/classic',
    element: <Dashboard />,
    layout: true,
  },
  {
    key: 'changePassword',
    path: '/change-password',
    element: <ChangePassword />,
    layout: false,
  },
  {
    key: 'candidates',
    path: '/candidates',
    element: <CandidateList />,
    label: 'Candidates',
    icon: Users,
    sidebar: true,
  },
  {
    key: 'candidateWorkspace',
    path: '/candidates/:id',
    element: <CandidateWorkspacePage />,
  },
  // Legacy alias — /v2/candidates/:id redirects to /candidates/:id in App.jsx

  {
    key: 'passportPool',
    path: '/passports',
    element: <PassportList />,
    label: 'Passport Pool',
    icon: BookOpen,
    sidebar: true,
  },
  {
    key: 'passportDetail',
    path: '/passports/:id',
    element: <PassportDetail />,
  },
  {
    key: 'passportScanner',
    path: '/passport/scanner',
    element: <PassportScanner />,
    layout: false,
  },
  {
    key: 'directory',
    path: '/directory',
    element: <DirectoryPage />,
    label: 'Directory',
    icon: UsersRound,
    sidebar: true,
  },
  {
    key: 'demands',
    path: '/demands',
    element: <DemandList />,
    label: 'Demands',
    icon: Briefcase,
    sidebar: true,
  },
  {
    key: 'demandDetail',
    path: '/demands/:id',
    element: <DemandDetail />,
  },
  {
    key: 'feims',
    path: '/feims',
    element: <FeimsSubmissionCenter />,
    label: 'FEIMS',
    icon: Globe,
    sidebar: true,
  },
  {
    key: 'gulfVisa',
    path: '/gulf/visa-board',
    element: <GulfVisaBoard />,
    label: 'Gulf Visa',
    icon: Sun,
    sidebar: true,
  },
  {
    key: 'malaysiaPlks',
    path: '/malaysia/plks-board',
    element: <MalaysiaPlksBoard />,
    label: 'Malaysia PLKS',
    icon: Tag,
    sidebar: true,
  },
  {
    key: 'medicalBoard',
    path: '/medical-board',
    element: <MedicalBoard />,
    label: 'Medical Board',
    icon: Stethoscope,
    sidebar: true,
  },
  {
    key: 'orientationBoard',
    path: '/orientation-board',
    element: <OrientationBoard />,
    label: 'Orientation',
    icon: GraduationCap,
    sidebar: true,
  },
  {
    key: 'documents',
    path: '/documents',
    element: <Documents />,
    label: 'Documents',
    icon: FileText,
    sidebar: true,
  },
  {
    key: 'tasks',
    path: '/tasks',
    element: <Tasks />,
    label: 'Tasks',
    icon: CheckSquare,
    sidebar: true,
  },
  {
    key: 'finance',
    path: '/finance',
    element: <Finance />,
    label: 'Finance',
    icon: Wallet,
    sidebar: true,
    allowedRoles: ['superadmin', 'admin', 'manager'],
  },
  {
    key: 'alerts',
    path: '/alerts',
    element: <Alerts />,
    label: 'Alerts',
    icon: Bell,
    sidebar: true,
  },
  {
    key: 'settings',
    path: '/settings',
    element: <Settings />,
    label: 'Settings',
    icon: Settings,
    sidebar: true,
    allowedRoles: ['admin'],
  },
  {
    key: 'clients',
    path: '/clients',
    element: (
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
      </div>
    ),
  },
  {
    key: 'schedules',
    path: '/schedules',
    element: (
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
      </div>
    ),
  },
  {
    key: 'superAdminDashboard',
    path: '/superadmin/dashboard',
    element: <SuperAdminDashboard />,
    label: 'Oversight Dashboard',
    icon: ShieldCheck,
    sidebar: true,
    allowedRoles: ['superadmin'],
  },
  {
    key: 'agencyManagement',
    path: '/superadmin/agencies',
    element: <AgencyManagement />,
    label: 'Agency Management',
    icon: Building2,
    sidebar: true,
    allowedRoles: ['superadmin'],
  },
  {
    key: 'register',
    path: '/register',
    element: <Register />,
    layout: false,
    allowedRoles: ['superadmin'],
  },
  {
    key: 'printBiodata',
    path: '/v2/print/biodata',
    element: <PrintBiodata />,
  },
  {
    key: 'printFeimsPacket',
    path: '/v2/print/feims-packet',
    element: <PrintFeimsPacket />,
  },
  {
    key: 'printDeparture',
    path: '/v2/print/departure',
    element: <PrintDeparture />,
  },
];

export const getSidebarRoutes = (userRole) =>
  routeDefinitions.filter((route) => route.sidebar && (!route.allowedRoles || route.allowedRoles.includes(userRole)));
