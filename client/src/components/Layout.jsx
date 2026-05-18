import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationToast from './NotificationToast';
import OnboardingChecklist from './OnboardingChecklist';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../hooks/useAlerts';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Briefcase,
  Wallet,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  CheckSquare,
  FileText,
  UsersRound,
  ShieldCheck,
  Building2,
  Globe,
  Sun,
  Tag,
  Stethoscope,
  GraduationCap,
  PlaneTakeoff
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, agency, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { getCounts, counts } = useAlerts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getCounts();
    const interval = setInterval(getCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExitImpersonation = () => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      // Restore admin session
      localStorage.setItem('token', adminToken);
      localStorage.removeItem('admin_token');
      // Force a page reload to refresh all context/API states with the real admin token
      window.location.href = '/superadmin/agencies';
    } else {
      logout();
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const canViewFinance = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'manager';

  // Sidebar nav is grouped to mirror the manpower workflow:
  // Main → Pipeline boards → Records → Operations
  const navSections = [
    {
      label: null,
      items: [
        { name: 'Today',      href: '/dashboard',  icon: LayoutDashboard },
        { name: 'Candidates', href: '/candidates', icon: Users },
        { name: 'Demands',    href: '/demands',    icon: Briefcase },
      ],
    },
    {
      label: 'Pipeline',
      items: [
        { name: 'Medical Board',   href: '/medical-board',       icon: Stethoscope },
        { name: 'Orientation',     href: '/orientation-board',   icon: GraduationCap },
        { name: 'Gulf Visa',       href: '/gulf/visa-board',     icon: Sun },
        { name: 'Malaysia PLKS',   href: '/malaysia/plks-board', icon: Tag },
        { name: 'FEIMS',           href: '/feims',               icon: Globe },
      ],
    },
    {
      label: 'Records',
      items: [
        { name: 'Passport Pool', href: '/passports',          icon: BookOpen },
        { name: 'Sponsors',      href: '/directory/sponsors', icon: Building2 },
        { name: 'Documents',     href: '/documents',          icon: FileText },
        { name: 'Departed',      href: '/departed',           icon: PlaneTakeoff },
      ],
    },
    {
      label: 'Operations',
      items: [
        { name: 'Tasks', href: '/tasks', icon: CheckSquare },
        ...(canViewFinance ? [{ name: 'Finance', href: '/finance', icon: Wallet }] : []),
        { name: 'Alerts', href: '/alerts', icon: Bell, badge: counts.critical > 0 ? counts.critical : null },
        { name: 'Staff', href: '/directory/staff', icon: UsersRound },
      ],
    },
  ];

  // Flat list for legacy consumers (mobile menu overlay).
  const mainNavItems = navSections.flatMap(s => s.items);

  const secondaryNavItems = isAdmin && user?.role !== 'superadmin' ? [
    { name: 'Settings', href: '/settings', icon: Settings },
  ] : [];

  const isImpersonating = user?.isImpersonating || !!localStorage.getItem('token')?.includes('impersonated'); // Fallback check
  
  const superAdminNavItems = [
    { name: 'Oversight Dashboard', href: '/superadmin/dashboard', icon: ShieldCheck },
    { name: 'Agency Management', href: '/superadmin/agencies', icon: Building2 },
  ];

  const currentNavSections = (user?.role === 'superadmin' && !isImpersonating)
    ? [{ label: null, items: superAdminNavItems }]
    : navSections;

  const mobileNavItems = [
    { name: 'Today', href: '/dashboard', icon: Home },
    { name: 'Candidates', href: '/candidates', icon: Users },
    { name: 'FEIMS', href: '/feims', icon: Globe },
    { name: 'Alerts', href: '/alerts', icon: Bell, badge: counts.critical > 0 ? counts.critical : null },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (item, isMobile = false) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    if (isMobile) {
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={() => setMobileMenuOpen(false)}
          className={`flex flex-col items-center justify-center py-2 px-3 ${
            active ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <div className="relative">
            <Icon size={24} />
            {item.badge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">{item.name}</span>
        </Link>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
          active
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon size={20} />
        <span className="text-sm font-medium">{item.name}</span>
        {item.badge && (
          <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${active ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <NotificationToast />
      {(user?.role === 'admin' || user?.role === 'superadmin') && <OnboardingChecklist />}
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:bg-white lg:border-r lg:border-gray-200 z-30">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-4 py-5 border-b border-gray-100">
            <Link to="/dashboard" className="block">
              {agency?.name && (
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                  {agency.name}
                </p>
              )}
              <h1 className="text-xl font-bold text-primary">ManpowerOS</h1>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4">
            {currentNavSections.map((section, i) => (
              <div key={section.label || `section-${i}`} className={i === 0 ? 'space-y-1' : 'mt-5 space-y-1'}>
                {section.label && (
                  <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {section.label}
                  </p>
                )}
                {section.items.map(item => renderNavItem(item))}
              </div>
            ))}

            {secondaryNavItems.length > 0 && (
              <>
                <div className="my-4 border-t border-gray-100" />
                {secondaryNavItems.map(item => renderNavItem(item))}
              </>
            )}
            
            {isImpersonating && (
               <>
                <div className="my-4 border-t border-gray-100" />
                <button
                  onClick={handleExitImpersonation}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-primary hover:bg-primary-50 transition-colors font-bold border border-primary-100"
                >
                  <ShieldCheck size={20} />
                  <span>Return to Admin</span>
                </button>
               </>
            )}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold uppercase">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:pl-60 pb-20 lg:pb-0">
        {isImpersonating && (
          <div className="bg-primary px-4 py-2 text-white flex items-center justify-between sticky top-0 z-20 shadow-md">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck size={16} />
              <span>Impersonating Agency: <strong>{agency?.name}</strong></span>
            </div>
            <button 
              onClick={handleExitImpersonation}
              className="text-xs bg-white text-primary px-3 py-1 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-sm"
            >
              Exit Impersonation
            </button>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map(item => renderNavItem(item, true))}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-2 px-3 ${mobileMenuOpen ? 'text-primary' : 'text-gray-500'}`}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            <span className="text-[10px] mt-1">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 text-primary">
              <h1 className="text-xl font-bold">ManpowerOS</h1>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
               {(user?.role === 'superadmin' ? superAdminNavItems : [...mainNavItems, ...secondaryNavItems]).map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg ${
                      active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium text-lg">{item.name}</span>
                  </Link>
                );
              })}
              <div className="border-t border-gray-100 my-4 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium text-lg">Sign out</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;