import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Sparkles,
  Calendar,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  HardDrive,
  Layers,
  Clock,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Notifications', icon: Bell },
  { id: 'renewal', label: 'Renewals', icon: Calendar },
  { id: 'expiration', label: 'Expirations', icon: AlertTriangle },
  { id: 'payment', label: 'Payments', icon: CreditCard },
  { id: 'quota', label: 'Quotas', icon: HardDrive },
  { id: 'security', label: 'Security', icon: ShieldAlert },
  { id: 'system', label: 'System', icon: Sparkles },
];

export const NotificationsPage = () => {
  const { unreadCount, fetchNotifications } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);

  const loadNotifications = async (cat = selectedCategory) => {
    try {
      setLoading(true);
      const params = {};
      if (cat !== 'all') params.category = cat;
      const res = await api.get('/notifications', { params });
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(selectedCategory);
  }, [selectedCategory]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      fetchNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      fetchNotifications();
      setActionMessage('All notifications marked as read.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getCategoryBadge = (cat = 'system') => {
    switch (cat) {
      case 'renewal':
        return { label: 'Renewal', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'expiration':
        return { label: 'Expiration', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'payment':
      case 'payment_success':
        return { label: 'Payment', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'quota':
      case 'quota_alert':
        return { label: 'Quota Alert', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'security':
        return { label: 'Security', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: 'Announcement', bg: 'bg-violet-100 text-[#6C4CF1] border-violet-200' };
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-[#172033] py-10 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="liquid-glass p-6 sm:p-8 rounded-3xl border border-white/90 shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-violet-100/80 px-3 py-1 rounded-full text-xs font-bold text-[#6C4CF1] mb-2 border border-violet-200/60">
              <Bell className="w-3.5 h-3.5" />
              <span>Smart Notification Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              Alerts & Communications
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time updates on billing cycles, quotas, and subscription health.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleMarkAllRead}
              disabled={notifications.every((n) => n.isRead)}
              className="touch-target px-4 py-2.5 rounded-xl text-xs font-bold bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm flex items-center space-x-1.5 transition-all pressable disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 text-[#6C4CF1]" />
              <span>Mark all read</span>
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Category Filter Pills (Horizontal Scrollable on Mobile) */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`touch-target px-4 py-2 rounded-2xl text-xs font-bold shrink-0 flex items-center space-x-2 transition-all pressable border ${
                  active
                    ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow-md shadow-violet-500/20'
                    : 'bg-white/80 text-slate-600 hover:text-[#172033] hover:bg-white border-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notification List Container */}
        <div className="space-y-3">
          {loading ? (
            <div className="liquid-glass p-12 rounded-3xl text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#6C4CF1] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Syncing live notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="liquid-glass p-12 rounded-3xl border border-white/90 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-[#6C4CF1] flex items-center justify-center mx-auto shadow-sm">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">All Caught Up!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No notifications found in this category. Important renewal notices and quota alerts will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const badge = getCategoryBadge(item.category || item.type);
              return (
                <div
                  key={item._id}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.isRead
                      ? 'bg-white/70 border-slate-200/70'
                      : 'liquid-glass border-violet-300 shadow-glass'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                        item.isRead ? 'bg-slate-100 text-slate-500' : 'bg-violet-100 text-[#6C4CF1]'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#6C4CF1] animate-pulse" />
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#172033]">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(item._id)}
                        className="touch-target px-3 py-1.5 rounded-xl bg-white hover:bg-violet-50 text-slate-600 hover:text-[#6C4CF1] border border-slate-200 text-xs font-semibold shadow-sm transition-all flex items-center space-x-1"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>
                    )}

                    {item.link && (
                      <Link
                        to={item.link}
                        className="touch-target px-3 py-1.5 rounded-xl bg-[#6C4CF1] hover:bg-[#5835ea] text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="touch-target p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

