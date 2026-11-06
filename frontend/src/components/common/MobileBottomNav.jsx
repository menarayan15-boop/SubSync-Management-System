import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  Layers,
  BookOpen,
  LayoutDashboard,
  User,
  Shield,
  CreditCard,
} from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const navItems = [
    {
      label: 'Home',
      path: '/',
      icon: Compass,
    },
    {
      label: 'Plans',
      path: '/plans',
      icon: Layers,
    },
    {
      label: 'Vault',
      path: '/resources',
      icon: BookOpen,
    },
    {
      label: user ? 'Dashboard' : 'Sign In',
      path: user ? '/dashboard' : '/login',
      icon: LayoutDashboard,
    },
    {
      label: user ? (isAdmin ? 'Admin' : 'Settings') : 'Register',
      path: user ? (isAdmin ? '/admin' : '/settings') : '/register',
      icon: user && isAdmin ? Shield : User,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-2 pt-1 pointer-events-none">
      <nav
        aria-label="Mobile Bottom Navigation"
        className="pointer-events-auto max-w-md mx-auto bg-white/85 backdrop-blur-xl border border-white/90 shadow-lg rounded-2xl px-2 py-1.5 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-xl px-2 py-1 text-[10px] font-bold transition-all duration-200 pressable ${
                active
                  ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  active ? 'scale-110 text-[#6C4CF1]' : 'text-slate-400'
                }`}
              />
              <span className="mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileBottomNav;

