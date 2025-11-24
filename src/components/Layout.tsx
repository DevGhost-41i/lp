import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Settings,
  AlertTriangle,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { appUser, user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['super_admin', 'admin', 'partner'] },
    { name: 'Publishers', icon: Users, href: '/publishers', roles: ['super_admin', 'admin', 'partner'] },
    { name: 'Alerts', icon: AlertTriangle, href: '/alerts', roles: ['super_admin', 'admin', 'partner'] },
    { name: 'Reports', icon: BarChart3, href: '/reports', roles: ['super_admin', 'admin', 'partner'] },
    { name: 'MFA Buster', icon: Shield, href: '/mfa-buster', roles: ['super_admin', 'admin'] },
    { name: 'Control Center', icon: Settings, href: '/mcm-parents', roles: ['super_admin', 'admin'] },
    { name: 'Profile', icon: User, href: '/profile', roles: ['super_admin', 'admin', 'partner'] },
  ];

  // If appUser missing, default to showing non-admin views for authenticated users
  const filteredNavigation = appUser?.role
    ? navigation.filter(item => item.roles.includes(appUser.role))
    : navigation.filter(item => item.roles.includes('partner'));

  return (
    <div className="min-h-screen bg-[#0E0E0E]">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#0E0E0E] border-b border-[#2C2C2C] z-50 h-12">
        <div className="flex items-center justify-between px-3 h-full">
          <h1 className="text-sm sm:text-base font-semibold text-white truncate">LP Media</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1.5 -mr-1.5"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`fixed inset-y-0 left-0 z-40 w-56 glass-panel transform transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-[#2C2C2C] hidden lg:block">
            <h1 className="text-lg font-semibold text-white">LP Media</h1>
            <p className="text-xs text-gray-400 mt-0.5">Control Center</p>
          </div>

          <div className="flex-1 p-2 overflow-y-auto pt-3 lg:pt-2">
            <div className="mb-4">
              <div className="glass-card rounded-lg p-3 mx-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#48a77f] to-[#3d9166] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-[#48a77f]/20">
                    {(user?.email || appUser?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400">Logged in as</p>
                    <p className="text-xs text-white font-medium truncate">{user?.email || appUser?.email || 'User'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${appUser?.role === 'super_admin' ? 'bg-[#48a77f]/20 text-[#48a77f] border border-[#48a77f]/20' :
                    appUser?.role === 'admin' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                      'bg-gray-700/50 text-gray-300 border border-gray-600/30'
                    }`}>
                    {(appUser?.role?.replace('_', ' ')) || 'AUTHENTICATED'}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#48a77f] animate-pulse shadow-[0_0_8px_rgba(72,167,127,0.5)]" />
                </div>
              </div>
            </div>

            <nav className="space-y-1 px-1">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-2.5 py-2 text-sm rounded-lg transition-all duration-200 group relative overflow-hidden ${location.pathname === item.href
                    ? 'text-white bg-gradient-to-r from-[#48a77f]/20 to-transparent border-l-2 border-[#48a77f]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-4 h-4 mr-2.5 flex-shrink-0 transition-colors ${location.pathname === item.href
                    ? 'text-[#48a77f]'
                    : 'text-gray-500 group-hover:text-gray-300'
                    }`} />
                  <span className="font-medium relative z-10">
                    {item.name}
                  </span>
                  {location.pathname === item.href && (
                    <div className="absolute inset-0 bg-[#48a77f]/5 blur-md" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-2 border-t border-[#2C2C2C]">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-2.5 py-2 text-sm text-gray-400 hover:bg-[#48a77f] rounded-lg transition-colors group"
            >
              <LogOut className="w-4 h-4 mr-2.5 flex-shrink-0 group-hover:text-white" />
              <span className="group-hover:text-white">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:pl-56 pt-12 lg:pt-0">
        <main className="p-3 sm:p-4 md:p-5 min-h-screen">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
