import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  Menu,
  X,
  User,
  Shield,
  CreditCard,
  Download,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Layers,
  Brain,
  Gift,
  Award,
  Users,
  ShieldCheck,
  BookOpen,
  Scan,
  ShieldAlert,
  Wallet,
  Compass,
  Coins,
} from 'lucide-react';

const Navbar = () => {
  const { user, subscription, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  const planName = subscription?.plan?.name || 'Free';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/80 shadow-[0_4px_20px_rgba(108,76,241,0.04)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#172033] to-[#24174b] flex items-center justify-center text-brand-400 shadow-soft group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(108,76,241,0.3)] transition-all">
                <img src="/logo.svg" alt="SubSync" className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tight text-[#172033]">
                Sub<span className="bg-gradient-to-r from-[#6C4CF1] to-[#4F46E5] bg-clip-text text-transparent">Sync</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <Link
                to="/"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/')
                    ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                    : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                }`}
              >
                Home
              </Link>
              <a
                href="/#features"
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#172033] hover:bg-white/60 transition-all"
              >
                Features
              </a>
              <Link
                to="/plans"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/plans')
                    ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                    : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                }`}
              >
                Pricing
              </Link>
              <Link
                to="/resources"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/resources')
                    ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                    : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                }`}
              >
                Vault
              </Link>
              {user && (
                <>
                  <Link
                    to="/intelligence"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/intelligence')
                        ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                        : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                    }`}
                  >
                    Intelligence
                  </Link>
                  <Link
                    to="/gift"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/gift')
                        ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                        : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                    }`}
                  >
                    Gifting
                  </Link>
                  <Link
                    to="/passport"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/passport')
                        ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                        : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                    }`}
                  >
                    Passport
                  </Link>
                  <Link
                    to="/discover"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/discover')
                        ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                        : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                    }`}
                  >
                    Discover
                  </Link>
                  <Link
                    to="/scanner"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/scanner')
                        ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                        : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                    }`}
                  >
                    Scanner
                  </Link>
                  <Link
                    to="/budget"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/budget')
                        ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                        : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                    }`}
                  >
                    Budget
                  </Link>
                  <Link
                    to="/rewards"
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive('/rewards')
                        ? 'text-[#6C4CF1] bg-violet-50/90 shadow-sm border border-violet-100'
                        : 'text-slate-600 hover:text-[#172033] hover:bg-white/60'
                    }`}
                  >
                    Rewards
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Action Icons & User Dropdown */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setProfileDropdownOpen(false);
                    }}
                    className="p-2.5 text-slate-600 hover:text-[#172033] hover:bg-white/80 rounded-xl relative transition-all border border-transparent hover:border-slate-200/60"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/80 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#172033] text-sm">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="bg-violet-100 text-[#6C4CF1] text-xs px-2.5 py-0.5 rounded-full font-bold">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-[#6C4CF1] hover:underline font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 px-2">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((item) => (
                            <div
                              key={item._id}
                              onClick={() => markAsRead(item._id)}
                              className={`p-3 rounded-2xl hover:bg-slate-50/80 cursor-pointer transition-all my-1 ${
                                !item.isRead ? 'bg-violet-50/60' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-[#172033]">{item.title}</p>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.message}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2 border-t border-slate-100 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-xs font-bold text-[#6C4CF1] hover:underline block py-1"
                        >
                          View all notifications →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Trigger */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(!profileDropdownOpen);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-2xl bg-white/70 hover:bg-white border border-slate-200/80 shadow-sm transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-bold text-[#172033] max-w-[120px] truncate">
                      {user.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Profile Dropdown Panel */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-2xl mb-1">
                        <p className="text-xs font-bold text-[#172033] truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Layers className="w-4 h-4 mr-2.5 text-[#6C4CF1]" />
                          Dashboard
                        </Link>
                        <Link
                          to="/intelligence"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Brain className="w-4 h-4 mr-2.5 text-[#6C4CF1]" />
                          SubSync Intelligence
                        </Link>
                        <Link
                          to="/gift"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Gift className="w-4 h-4 mr-2.5 text-pink-500" />
                          Gift a Subscription
                        </Link>
                        <Link
                          to="/passport"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Award className="w-4 h-4 mr-2.5 text-amber-500" />
                          My Skill Passport
                        </Link>
                        <Link
                          to="/team"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Users className="w-4 h-4 mr-2.5 text-indigo-500" />
                          Family & Team
                        </Link>
                        <Link
                          to="/trust"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2.5 text-emerald-600" />
                          Trust & Security Center
                        </Link>
                        <Link
                          to="/scanner"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Scan className="w-4 h-4 mr-2.5 text-violet-600" />
                          Subscription Scanner
                        </Link>
                        <Link
                          to="/cancellation"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <ShieldAlert className="w-4 h-4 mr-2.5 text-rose-500" />
                          Cancellation Assistant
                        </Link>
                        <Link
                          to="/budget"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Wallet className="w-4 h-4 mr-2.5 text-purple-600" />
                          Budget Planner
                        </Link>
                        <Link
                          to="/discover"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Compass className="w-4 h-4 mr-2.5 text-cyan-600" />
                          Discover Subscriptions
                        </Link>
                        <Link
                          to="/rewards"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Coins className="w-4 h-4 mr-2.5 text-amber-500" />
                          SubSync Rewards
                        </Link>
                        <Link
                          to="/billing"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <CreditCard className="w-4 h-4 mr-2.5 text-[#6C4CF1]" />
                          Billing & Invoices
                        </Link>
                        <Link
                          to="/resources"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#6C4CF1] hover:bg-violet-50/70 rounded-xl transition-all"
                        >
                          <Download className="w-4 h-4 mr-2.5 text-[#6C4CF1]" />
                          Digital Vault
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#172033] hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <Settings className="w-4 h-4 mr-2.5 text-slate-400" />
                          Account Settings
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all"
                          >
                            <Shield className="w-4 h-4 mr-2.5 text-amber-600" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <LogOut className="w-4 h-4 mr-2.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-[#172033] hover:bg-white/60 rounded-xl transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#6C4CF1] to-[#4F46E5] hover:from-[#5835ea] hover:to-[#4338ca] rounded-xl shadow-[0_4px_16px_rgba(108,76,241,0.3)] transition-all pressable"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="touch-target p-2 rounded-xl text-slate-700 hover:bg-white/80 active:scale-95 transition-all"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 rounded-b-3xl shadow-xl animate-in slide-in-from-top-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-2xl text-sm font-bold text-slate-800 hover:bg-violet-50 hover:text-[#6C4CF1] transition-all"
          >
            Home
          </Link>
          <Link
            to="/plans"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-2xl text-sm font-bold text-slate-800 hover:bg-violet-50 hover:text-[#6C4CF1] transition-all"
          >
            Plans & Pricing
          </Link>
          <Link
            to="/resources"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-2xl text-sm font-bold text-slate-800 hover:bg-violet-50 hover:text-[#6C4CF1] transition-all"
          >
            Digital Library
          </Link>
          <Link
            to="/support"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-2xl text-sm font-bold text-slate-800 hover:bg-violet-50 hover:text-[#6C4CF1] transition-all"
          >
            Support Hub
          </Link>

          {user ? (
            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              <div className="p-3 bg-violet-50/60 border border-violet-100 rounded-2xl">
                <p className="font-bold text-xs text-[#172033]">{user.name}</p>
                <p className="text-[11px] text-slate-500">{user.email}</p>
                <div className="mt-2 inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-[#6C4CF1]">
                  {planName} Plan Active
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                to="/intelligence"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                SubSync Intelligence
              </Link>
              <Link
                to="/gift"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Gift a Subscription
              </Link>
              <Link
                to="/passport"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                My Skill Passport
              </Link>
              <Link
                to="/team"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Family & Team
              </Link>
              <Link
                to="/trust"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Trust & Security Center
              </Link>
              <Link
                to="/scanner"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Subscription Scanner
              </Link>
              <Link
                to="/cancellation"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancellation Assistant
              </Link>
              <Link
                to="/budget"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Budget Planner
              </Link>
              <Link
                to="/discover"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Discover Subscriptions
              </Link>
              <Link
                to="/rewards"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                SubSync Rewards
              </Link>
              <Link
                to="/billing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Billing & Invoices
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50"
                >
                  Admin Console
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="touch-target text-center py-2.5 px-3 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="touch-target text-center py-2.5 px-3 bg-gradient-to-r from-[#6C4CF1] to-[#4F46E5] rounded-xl text-xs font-bold text-white shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
