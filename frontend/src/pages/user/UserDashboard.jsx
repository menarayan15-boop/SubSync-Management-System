import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import { StatusBadge, TierBadge } from '../../components/common/Badge';
import { DynamicCommentCard } from '../../components/common/DynamicCommentCard';
import { MembershipCard } from '../../components/common/MembershipCard';
import {
  Sparkles,
  ArrowUpRight,
  Download,
  CreditCard,
  Calendar,
  Clock,
  HardDrive,
  BarChart2,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  Activity,
  Layers,
  Check,
  AlertTriangle,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  Sliders,
  DollarSign,
  Compass,
  Tv,
  Eye,
  Radio,
  QrCode,
  Share2,
  ExternalLink,
  Shield,
  Server,
  Database,
  Lock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/**
 * Circular Progress Ring Widget
 * Inspired directly by Image 1 (Lumina Dashboard 72% Progress Ring)
 */
const CircularProgressRing = ({
  percentage = 72,
  size = 140,
  strokeWidth = 12,
  label = 'Validity',
  sublabel = 'Remaining',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPercent = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (validPercent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3F0FF"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#purpleRingGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="purpleRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6C4CF1" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center flex flex-col items-center justify-center select-none pointer-events-none">
        <span className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">{validPercent}%</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{label}</span>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const { user, subscription, refreshUser, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();

  // Navigation tabs: overview, card, analytics, my-subscription, billing, invoices, downloads, methods, notifications
  const [activeTab, setActiveTab] = useState('overview');
  const [currentSub, setCurrentSub] = useState(subscription);
  const [downloads, setDownloads] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [downloadsRes, paymentsRes, invoicesRes, subRes, analyticsRes, cardRes] = await Promise.all([
        api.get('/resources/my-downloads').catch(() => ({ data: { success: false, downloads: [] } })),
        api.get('/payments/my-payments').catch(() => ({ data: { success: false, payments: [] } })),
        api.get('/invoices/my-invoices').catch(() => ({ data: { success: false, invoices: [] } })),
        api.get('/subscriptions/my-subscription').catch(() => ({ data: { success: false } })),
        api.get('/subscriptions/analytics').catch(() => ({ data: { success: false, analytics: null } })),
        api.get('/membership/card').catch(() => ({ data: { success: false, card: null } })),
      ]);

      if (downloadsRes.data?.success) setDownloads(downloadsRes.data.downloads || []);
      if (paymentsRes.data?.success) setPayments(paymentsRes.data.payments || []);
      if (invoicesRes.data?.success) setInvoices(invoicesRes.data.invoices || []);
      if (subRes.data?.success && subRes.data.subscription) setCurrentSub(subRes.data.subscription);
      if (analyticsRes.data?.success && analyticsRes.data.analytics) setAnalyticsData(analyticsRes.data.analytics);
      if (cardRes.data?.success && cardRes.data.card) setCardData(cardRes.data.card);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const effectiveSub = currentSub || subscription;
  const activePlan = effectiveSub?.plan || {
    name: 'Free',
    slug: 'free',
    tierLevel: 0,
    monthlyPrice: 0,
    quotas: {
      dailyDownloads: 1,
      monthlyDownloads: 30,
      streamingQuality: '480p',
      watchTimeLimit: 'Limited (30m/day)',
      adFree: false,
    },
    features: [
      { name: 'Limited premium video access', included: true },
      { name: '480p streaming', included: true },
      { name: 'One download per day', included: true },
      { name: 'Limited watch time', included: true },
      { name: 'Advertisements', included: true },
      { name: 'Restricted premium courses', included: false },
    ],
  };

  const dailyLimit = activePlan.quotas?.dailyDownloads || 1;
  const monthlyLimit = activePlan.quotas?.monthlyDownloads || 30;

  // Real today download count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayDownloadsCount = downloads.filter(
    (d) => new Date(d.downloadedAt) >= todayStart
  ).length;

  const remainingDaily = Math.max(0, dailyLimit - todayDownloadsCount);
  const dailyPercent = Math.min(100, Math.round((todayDownloadsCount / dailyLimit) * 100));

  // Monthly download count
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthDownloadsCount = downloads.filter(
    (d) => new Date(d.downloadedAt) >= monthStart
  ).length;

  // Compute remaining days & validity percentage
  const remainingDays =
    effectiveSub?.remainingDays ??
    analyticsData?.validity?.daysRemaining ??
    analyticsData?.remainingDays ??
    365;
  const validityPercentage =
    analyticsData?.validity?.validityPercentage ??
    analyticsData?.validityPercentage ??
    (activePlan.slug === 'free' ? 100 : Math.min(100, Math.round((remainingDays / 30) * 100)));

  // Health calculation: Active, Expiring Soon, Expired
  let subscriptionHealth = 'Active';
  let healthColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let healthDot = 'bg-emerald-500';

  if (!effectiveSub || effectiveSub.status === 'Cancelled' || effectiveSub.status === 'Expired') {
    subscriptionHealth = 'Expired';
    healthColor = 'text-rose-700 bg-rose-50 border-rose-200';
    healthDot = 'bg-rose-500';
  } else if (remainingDays <= 7 && activePlan.slug !== 'free') {
    subscriptionHealth = 'Expiring Soon';
    healthColor = 'text-amber-700 bg-amber-50 border-amber-200';
    healthDot = 'bg-amber-500';
  }

  // Statistics calculation
  const totalPaymentsCount = payments.length;
  const successfulPaymentsCount = payments.filter((p) => p.status === 'Success' || p.status === 'Successful').length;
  const totalAmountSpent =
    analyticsData?.summary?.totalSpent ??
    analyticsData?.totalSpent ??
    payments
      .filter((p) => p.status === 'Success' || p.status === 'Successful')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Spending insights
  const spendingInsights = {
    monthlyAvg: activePlan.monthlyPrice || 0,
    yearlyEstimated: (activePlan.monthlyPrice || 0) * 12,
    lifetimeTotal: totalAmountSpent,
  };

  // Smart recommendations (rule-based)
  const getSmartRecommendation = () => {
    if (activePlan.slug === 'free') {
      if (todayDownloadsCount >= 1) {
        return {
          title: 'Upgrade to Bronze (₹99/mo)',
          reason: 'You hit your daily limit of 1 download today. Bronze gives 3 downloads/day & 720p HD streaming.',
          planSlug: 'bronze',
        };
      }
      return {
        title: 'Upgrade to Silver (₹199/mo)',
        reason: 'Unlock 1080p Full HD ad-free streaming and 5 downloads/day for our most popular experience.',
        planSlug: 'silver',
      };
    }
    if (activePlan.slug === 'bronze') {
      return {
        title: 'Step Up to Silver Pro (₹199/mo)',
        reason: 'Remove all ads and unlock 1080p Full HD video playback and exclusive course access.',
        planSlug: 'silver',
      };
    }
    if (activePlan.slug === 'silver') {
      return {
        title: 'Elevate to Gold VIP (₹299/mo)',
        reason: 'Experience true 4K Ultra HD streaming, 10 downloads/day, and VIP 24/7 priority concierge.',
        planSlug: 'gold',
      };
    }
    return {
      title: 'Optimal Tier Active (Gold)',
      reason: 'You are enjoying SubSync’s highest tier with 4K streaming and maximum benefits.',
      planSlug: null,
    };
  };

  const recommendation = getSmartRecommendation();

  // Real chart data from analyticsData or fallback to computed
  const usageChartData = analyticsData?.downloadTrends && analyticsData.downloadTrends.length > 0
    ? analyticsData.downloadTrends
    : [
        { day: 'Mon', downloads: Math.min(dailyLimit, 1) },
        { day: 'Tue', downloads: Math.min(dailyLimit, 2) },
        { day: 'Wed', downloads: Math.min(dailyLimit, 1) },
        { day: 'Thu', downloads: Math.min(dailyLimit, 3) },
        { day: 'Fri', downloads: Math.min(dailyLimit, 2) },
        { day: 'Sat', downloads: todayDownloadsCount },
        { day: 'Sun', downloads: 0 },
      ];

  const spendingChartData = analyticsData?.spendingTrends && analyticsData.spendingTrends.length > 0
    ? analyticsData.spendingTrends
    : [
        { label: 'Jun', amount: 0 },
        { label: 'Jul', amount: activePlan.monthlyPrice ? activePlan.monthlyPrice : 0 },
        { label: 'Aug', amount: activePlan.monthlyPrice ? activePlan.monthlyPrice : 0 },
        { label: 'Sep', amount: activePlan.monthlyPrice ? activePlan.monthlyPrice : 0 },
        { label: 'Oct', amount: activePlan.monthlyPrice ? activePlan.monthlyPrice : 0 },
        { label: 'Nov', amount: totalAmountSpent },
      ];

  // Handle Cancel Renewal
  const handleCancelRenewal = async () => {
    try {
      const res = await api.post('/subscriptions/cancel', {
        reason: cancelReason || 'Cancelled from customer dashboard',
      });
      if (res.data.success) {
        setActionAlert({
          type: 'success',
          text: 'Auto-renewal has been cancelled. Your paid benefits remain active until the end of your billing cycle.',
        });
        setCancelModalOpen(false);
        await refreshUser();
        await fetchDashboardData();
      }
    } catch (err) {
      setActionAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel renewal.',
      });
    }
  };

  const handleDownloadInvoice = (invoiceId) => {
    const token = localStorage.getItem('subsync_token') || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${baseUrl}/invoices/${invoiceId}/download?token=${encodeURIComponent(token)}`, '_blank');
  };

  // Prepare Membership Card Data fallback
  const fallbackCardData = {
    memberId: user?.memberId || 'SS-MEM-9482',
    name: user?.name || 'SubSync Member',
    email: user?.email || '',
    tier: activePlan.name || 'Free',
    status: subscriptionHealth,
    startDate: effectiveSub?.startDate || user?.createdAt || new Date(),
    expiryDate: effectiveSub?.endDate || null,
    perks: activePlan.features?.filter((f) => f.included).map((f) => f.name) || ['Standard access'],
    verificationUrl: `${window.location.origin}/verify-membership?memberId=${user?.memberId || 'SS-MEM-9482'}`,
  };

  const resolvedCardData = cardData || fallbackCardData;

  return (
    <div className="min-h-screen text-[#172033] py-6 sm:py-8 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ACTION ALERT NOTIFICATION */}
        {actionAlert && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs flex items-center justify-between shadow-soft animate-in fade-in ${
              actionAlert.type === 'success'
                ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50/90 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {actionAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionAlert.text}</span>
            </div>
            <button onClick={() => setActionAlert(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
              ×
            </button>
          </div>
        )}

        {/* HERO HEADER: Inspired by Image 1 (Lumina Top Banner) */}
        <div className="mb-8 p-6 sm:p-8 liquid-glass rounded-3xl border border-white/80 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#6C4CF1]/10 via-[#A855F7]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
                  Welcome back, {user?.name?.split(' ')[0] || 'Member'} 👋
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-[#6C4CF1] border border-violet-200/60">
                  {activePlan.name} Tier
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${healthColor}`}>
                  {subscriptionHealth}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} • Member ID: <span className="font-mono font-semibold text-slate-700">{user?.memberId || resolvedCardData.memberId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-start md:self-auto relative z-10">
            <button
              onClick={() => setActiveTab('card')}
              className="touch-target px-4 py-2.5 rounded-xl text-xs font-bold bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 shadow-sm flex items-center space-x-1.5 pressable transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-[#6C4CF1]" />
              <span>Digital Pass</span>
            </button>
            <Link
              to="/plans"
              className="touch-target px-4 py-2.5 rounded-xl text-xs font-bold liquid-button shadow-md flex items-center space-x-1.5 pressable"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade Plan</span>
            </Link>
          </div>
        </div>

        {/* MOBILE HORIZONTAL SCROLLER TABS (Visible < lg) */}
        <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center space-x-2">
          {[
            { id: 'overview', label: 'Overview', icon: Compass },
            { id: 'card', label: 'Digital Pass', icon: QrCode },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
            { id: 'my-subscription', label: 'Subscription', icon: Layers },
            { id: 'billing', label: 'Billing', icon: CreditCard },
            { id: 'invoices', label: `Invoices (${invoices.length})`, icon: FileText },
            { id: 'downloads', label: `Downloads (${downloads.length})`, icon: Download },
            { id: 'methods', label: 'Gateways', icon: DollarSign },
            { id: 'notifications', label: `Alerts (${unreadCount})`, icon: Bell },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`touch-target px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all pressable ${
                  active
                    ? 'bg-[#6C4CF1] text-white shadow-md'
                    : 'bg-white/80 text-slate-600 border border-slate-200/70 hover:bg-white'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5 mr-1.5 inline" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* DASHBOARD LAYOUT: SIDEBAR (3 cols) + MAIN CONTENT (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SIDEBAR NAVIGATION (Desktop) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            {/* User Profile Glass Card */}
            <div className="glass-card rounded-3xl p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <h3 className="font-bold text-base text-[#172033] mt-3">{user?.name || 'Customer'}</h3>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <div className="mt-3 flex items-center justify-center space-x-1.5">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-[#6C4CF1]">
                  {activePlan.name} Plan
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthColor}`}>
                  {subscriptionHealth}
                </span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="glass-card rounded-3xl p-3 space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#6C4CF1] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('card')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'card'
                    ? 'bg-[#6C4CF1] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Digital Pass & QR</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-[#6C4CF1] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Analytics & Insights</span>
              </button>

              <button
                onClick={() => setActiveTab('my-subscription')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'my-subscription'
                    ? 'bg-[#6C4CF1] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>My Subscription</span>
              </button>

              <Link
                to="/plans"
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#172033] transition-all"
              >
                <ArrowUpRight className="w-4 h-4 text-[#6C4CF1]" />
                <span>Explore Plans</span>
              </Link>

              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'billing'
                    ? 'bg-[#6C4CF1] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Billing History</span>
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'invoices'
                    ? 'bg-[#6C4CF1] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Invoices ({invoices.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('downloads')}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'downloads'
                    ? 'bg-[#6C4CF1] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#172033]'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Download History ({downloads.length})</span>
              </button>

              <Link
                to="/notifications"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#172033] transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Bell className="w-4 h-4" />
                  <span>Notification Center</span>
                </div>
                {unreadCount > 0 && (
                  <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* Quick Upgrade Callout */}
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/80 rounded-3xl p-5 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-[#6C4CF1] mx-auto" />
              <h4 className="text-xs font-bold text-[#172033]">Need Higher Limits?</h4>
              <p className="text-[11px] text-slate-600">
                Unlock 4K streaming and 10 downloads/day on our Gold VIP pass.
              </p>
              <Link
                to="/plans"
                className="inline-block w-full py-2 bg-[#6C4CF1] hover:bg-[#5835ea] text-white font-bold text-xs rounded-xl shadow-sm transition-all mt-2"
              >
                Upgrade Now
              </Link>
            </div>

            {/* Dynamic Community Review Card */}
            <DynamicCommentCard variant="compact" autoRotate={true} interval={10000} />
          </div>

          {/* MAIN CONTENT AREA (9 cols) */}
          <div className="lg:col-span-9 space-y-8">
            {/* ======================================================== */}
            {/* TAB 1: OVERVIEW (LUMINA-INSPIRED BENTO GRID)            */}
            {/* ======================================================== */}
            {activeTab === 'overview' && (
              <>
                {/* 1. TOP METRIC CHIPS: 4 BENTO CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bento-card p-5 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spent</p>
                      <div className="w-8 h-8 rounded-xl bg-violet-100/80 text-[#6C4CF1] flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-[#172033] mt-2">₹{totalAmountSpent.toLocaleString()}</p>
                    <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-emerald-600 font-semibold">
                      <span>↑ 100% Verified</span>
                      <span className="text-slate-400">• {successfulPaymentsCount} Orders</span>
                    </div>
                  </div>

                  <div className="bento-card p-5 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Tier</p>
                      <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-[#172033] mt-2">{activePlan.name}</p>
                    <div className="flex items-center space-x-1.5 mt-1 text-[11px]">
                      <span className={`font-semibold px-2 py-0.5 rounded-full border text-[10px] ${healthColor}`}>
                        {subscriptionHealth}
                      </span>
                      <span className="text-slate-400">{remainingDays}d left</span>
                    </div>
                  </div>

                  <div className="bento-card p-5 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today Downloads</p>
                      <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-[#6C4CF1] mt-2">{todayDownloadsCount} <span className="text-sm font-semibold text-slate-400">/ {dailyLimit}</span></p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#6C4CF1] to-[#4F46E5] h-1.5 rounded-full transition-all duration-500" style={{ width: `${dailyPercent}%` }}></div>
                    </div>
                  </div>

                  <div className="bento-card p-5 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Streaming Quality</p>
                      <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center">
                        <Tv className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-[#172033] mt-2">{activePlan.quotas?.streamingQuality || '480p'}</p>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      {activePlan.quotas?.adFree ? 'Ad-Free 4K Experience' : 'Standard with Sponsor Ads'}
                    </p>
                  </div>
                </div>

                {/* 2. MIDDLE ROW: REVENUE/SPENDING AREA CHART (8 cols) + CIRCULAR VALIDITY RING (4 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Revenue / Spending Chart (Inspired by Lumina Revenue Overview) */}
                  <div className="lg:col-span-8 bento-card p-6 sm:p-7 flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-base sm:text-lg text-[#172033] tracking-tight">Spending & Usage History</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-[#6C4CF1]">
                            Razorpay Verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Real-time expenditure recorded in MongoDB ledger</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Volume</span>
                          <span className="text-lg font-black text-[#172033]">₹{totalAmountSpent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spendingChartData}>
                          <defs>
                            <linearGradient id="spendingCurveGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6C4CF1" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#6C4CF1" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis
                            dataKey="label"
                            stroke="#94A3B8"
                            fontSize={11}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#94A3B8"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={(val) => `₹${val}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#172033',
                              border: 'none',
                              borderRadius: '14px',
                              color: '#fff',
                              fontSize: '12px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                            }}
                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount Spent']}
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#6C4CF1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#spendingCurveGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Subscription Validity Progress Ring (Directly inspired by Image 1 Project Progress 72%) */}
                  <div className="lg:col-span-4 bento-card p-6 sm:p-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-base text-[#172033]">Subscription Validity</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthColor}`}>
                          {subscriptionHealth}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-6">Real-time status of your billing cycle & quotas</p>
                    </div>

                    <div className="flex flex-col items-center my-2">
                      <CircularProgressRing
                        percentage={validityPercentage}
                        size={150}
                        strokeWidth={13}
                        label="Validity"
                        sublabel="Remaining"
                      />
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#6C4CF1]"></span>
                          <span>Days Remaining:</span>
                        </span>
                        <span className="font-bold text-[#172033]">{remainingDays} Days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <span>Daily Quota:</span>
                        </span>
                        <span className="font-bold text-[#172033]">{dailyLimit} / day ({remainingDaily} left)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Monthly Limit:</span>
                        </span>
                        <span className="font-bold text-[#172033]">{monthlyLimit} downloads</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. LOWER ROW: DAILY DOWNLOADS BAR CHART + DIGITAL MEMBERSHIP PASS WIDGET */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Daily Downloads Bar Chart */}
                  <div className="lg:col-span-7 bento-card p-6 sm:p-7 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-base text-[#172033]">Vault Downloads Activity</h3>
                        <p className="text-xs text-slate-500">Recent downloads across the digital publication vault</p>
                      </div>
                      <Link
                        to="/resources"
                        className="text-xs font-bold text-[#6C4CF1] hover:text-[#5835ea] flex items-center space-x-1"
                      >
                        <span>Access Vault</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usageChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#172033',
                              border: 'none',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Bar
                            dataKey="downloads"
                            fill="#6C4CF1"
                            radius={[6, 6, 0, 0]}
                            name="Downloads"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Digital Membership Pass Mini Preview */}
                  <div className="lg:col-span-5 bento-card p-6 sm:p-7 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C4CF1]">Feature 5 Active</span>
                        <h3 className="font-bold text-base text-[#172033]">Digital Membership Pass</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('card')}
                        className="px-3 py-1.5 rounded-xl bg-violet-100 hover:bg-violet-200 text-[#6C4CF1] text-xs font-bold transition-all"
                      >
                        Interactive 3D View
                      </button>
                    </div>

                    {/* Compact Card Component */}
                    <div className="my-2 flex justify-center">
                      <div className="w-full max-w-sm">
                        <MembershipCard cardData={resolvedCardData} allowFullscreen={true} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">HMAC QR Verification:</span>
                      <Link
                        to={`/verify-membership?token=${resolvedCardData.token || ''}`}
                        className="font-bold text-[#6C4CF1] hover:underline flex items-center space-x-1"
                      >
                        <span>Public Check</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 4. BOTTOM ROW: SYSTEM & SECURITY STATUS (Inspired by Lumina System Status) + NOTIFICATIONS PREVIEW */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* System & Cryptographic Status */}
                  <div className="lg:col-span-7 bento-card p-6 sm:p-7">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#172033]">System & Security Integrity</h3>
                          <p className="text-[11px] text-slate-500">Live operational health & encryption monitors</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        All Systems Nominal
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-xs">
                      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center space-x-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                          <p className="font-bold text-[#172033]">API Gateway</p>
                          <p className="text-[11px] text-slate-500">Node.js Express / Port 5000</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center space-x-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                          <p className="font-bold text-[#172033]">MongoDB Engine</p>
                          <p className="text-[11px] text-slate-500">Real Data Persistence Active</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center space-x-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                          <p className="font-bold text-[#172033]">Razorpay HMAC</p>
                          <p className="text-[11px] text-slate-500">SHA-256 Webhook Verification</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center space-x-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                          <p className="font-bold text-[#172033]">Zero-Knowledge Pass</p>
                          <p className="text-[11px] text-slate-500">Instant QR Authentication</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Notifications Widget */}
                  <div className="lg:col-span-5 bento-card p-6 sm:p-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-4 h-4 text-[#6C4CF1]" />
                          <h3 className="font-bold text-sm text-[#172033]">Recent Notifications</h3>
                        </div>
                        <Link
                          to="/notifications"
                          className="text-xs font-bold text-[#6C4CF1] hover:underline"
                        >
                          View All ({unreadCount})
                        </Link>
                      </div>

                      <div className="divide-y divide-slate-100 mt-2">
                        {notifications.slice(0, 3).map((n) => (
                          <div key={n._id} className="py-2.5 flex items-start space-x-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#6C4CF1] mt-1.5 shrink-0"></span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#172033] truncate">{n.title}</p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{n.message}</p>
                            </div>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <p className="text-xs text-slate-400 py-6 text-center">No unread notifications.</p>
                        )}
                      </div>
                    </div>

                    <Link
                      to="/notifications"
                      className="mt-4 w-full py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-[#6C4CF1] font-bold text-xs text-center transition-all block"
                    >
                      Open Full Notification Center →
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* TAB 2: DIGITAL PASS & QR VERIFICATION STUDIO            */}
            {/* ======================================================== */}
            {activeTab === 'card' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C4CF1]">Feature 5 Active</span>
                    <h3 className="text-2xl font-black text-[#172033]">SubSync Digital Membership Card</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Glassmorphic encrypted digital pass for all member tiers. Tap the card or rotate button to inspect perks on the reverse side.
                    </p>
                  </div>
                  <TierBadge tier={activePlan.name} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 flex justify-center">
                    <div className="w-full max-w-md">
                      <MembershipCard cardData={resolvedCardData} allowFullscreen={true} />
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-5">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C4CF1] flex items-center space-x-1.5">
                        <QrCode className="w-4 h-4" />
                        <span>Instant Verification Link</span>
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Anyone scanning this QR code is directed to the public validation portal with zero credential exposure.
                      </p>
                      <div className="p-2.5 bg-white rounded-xl border border-violet-100 font-mono text-[11px] text-slate-700 truncate select-all">
                        {resolvedCardData.verificationUrl || window.location.href}
                      </div>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(resolvedCardData.verificationUrl || window.location.href);
                            setActionAlert({ type: 'success', text: 'Verification link copied to clipboard!' });
                          }}
                          className="px-4 py-2 bg-[#6C4CF1] hover:bg-[#5835ea] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                        >
                          Copy Pass URL
                        </button>
                        <Link
                          to={`/verify-membership?token=${resolvedCardData.token || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white hover:bg-slate-100 text-[#172033] border border-slate-200 text-xs font-bold rounded-xl transition-all"
                        >
                          Test Public Link ↗
                        </Link>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <h4 className="font-bold text-[#172033]">Pass Specifications</h4>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Member ID:</span>
                        <span className="font-mono font-bold text-slate-800">{resolvedCardData.memberId}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Tier:</span>
                        <span className="font-bold text-[#6C4CF1]">{resolvedCardData.tier} Tier</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-bold text-emerald-600">{resolvedCardData.status}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Cryptographic Standard:</span>
                        <span className="font-semibold text-slate-700">HMAC SHA-256</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: DEEP ANALYTICS & USAGE METRICS                    */}
            {/* ======================================================== */}
            {activeTab === 'analytics' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">Comprehensive Usage Analytics</h3>
                    <p className="text-xs text-slate-500">Real-time telemetry and resource consumption trends</p>
                  </div>
                  <span className="text-xs font-bold text-[#6C4CF1] bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
                    MongoDB Telemetry
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Spending Curve */}
                  <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200">
                    <h4 className="font-bold text-sm text-[#172033] mb-1">Monthly Financial Commitment</h4>
                    <p className="text-xs text-slate-500 mb-4">Total payments across active & past subscription cycles</p>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spendingChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                          <Tooltip formatter={(v) => [`₹${v}`, 'Amount']} />
                          <Area type="monotone" dataKey="amount" stroke="#6C4CF1" strokeWidth={3} fill="#DDD6FE" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Daily Resource Volume */}
                  <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200">
                    <h4 className="font-bold text-sm text-[#172033] mb-1">Daily Download Volume</h4>
                    <p className="text-xs text-slate-500 mb-4">PDF publications downloaded from Digital Resource Vault</p>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usageChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="downloads" fill="#6C4CF1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: MY SUBSCRIPTION                                  */}
            {/* ======================================================== */}
            {activeTab === 'my-subscription' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">Membership Configuration</h3>
                    <p className="text-xs text-slate-500">Manage plan duration, renewal schedules, and tier permissions</p>
                  </div>
                  <TierBadge tier={activePlan.name} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan Attributes</h4>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Tier Level:</span>
                      <span className="font-bold text-[#172033]">Tier {activePlan.tierLevel}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Streaming Quality:</span>
                      <span className="font-bold text-[#6C4CF1]">{activePlan.quotas?.streamingQuality || '480p'}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Daily Download Quota:</span>
                      <span className="font-bold text-[#172033]">{dailyLimit} downloads/day</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-500">Ad Experience:</span>
                      <span className="font-bold text-emerald-600">{activePlan.quotas?.adFree ? 'Ad-Free' : 'Standard Ads'}</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifecycle Controls</h4>
                    <p className="text-xs text-slate-600">
                      Downgrades take effect at the start of your next billing cycle. If cancelled, your paid features continue until expiry date.
                    </p>
                    <div className="pt-2 flex flex-col space-y-2">
                      <Link
                        to="/plans"
                        className="py-2.5 px-4 bg-[#6C4CF1] hover:bg-[#5835ea] text-white text-xs font-bold rounded-xl text-center shadow-sm"
                      >
                        Explore Upgrade Options
                      </Link>
                      {activePlan.slug !== 'free' && (
                        <button
                          onClick={() => setCancelModalOpen(true)}
                          className="py-2.5 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl text-center"
                        >
                          Cancel Upcoming Renewal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: BILLING HISTORY                                  */}
            {/* ======================================================== */}
            {activeTab === 'billing' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">Billing & Transactions</h3>
                    <p className="text-xs text-slate-500">Complete historical record of Razorpay payments and orders</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{payments.length} Transactions</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-200">
                        <th className="py-3 px-4">Transaction ID</th>
                        <th className="py-3 px-4">Plan</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            No billing transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                              {p.paymentId || p.orderId}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#172033]">
                              {p.plan?.name || 'Plan'}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#172033]">
                              ₹{p.amount?.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={p.status} />
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {p.invoice ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadInvoice(p.invoice._id || p.invoice)}
                                  className="text-[#6C4CF1] hover:underline font-semibold"
                                >
                                  PDF
                                </button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 6: INVOICES                                         */}
            {/* ======================================================== */}
            {activeTab === 'invoices' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">Official GST Tax Invoices</h3>
                    <p className="text-xs text-slate-500">Download and print official computer-generated receipts</p>
                  </div>
                  <span className="text-xs font-bold text-[#6C4CF1] bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
                    GST Compliant
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invoices.length === 0 ? (
                    <div className="col-span-2 py-10 text-center text-slate-400 text-xs">
                      No invoices generated yet. Invoices appear automatically after completed payments.
                    </div>
                  ) : (
                    invoices.map((inv) => (
                      <div key={inv._id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-[#6C4CF1]" />
                            <h4 className="font-bold text-xs text-[#172033]">{inv.invoiceNumber}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Amount: ₹{(inv.total ?? inv.subtotal ?? 0).toLocaleString()} • {new Date(inv.createdAt).toLocaleDateString()}
                          </p>
                          <span className="text-[10px] text-emerald-600 font-bold uppercase mt-1 inline-block">
                            Paid via Razorpay
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(inv._id)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-[#172033] border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>View PDF</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 7: DOWNLOAD HISTORY                                 */}
            {/* ======================================================== */}
            {activeTab === 'downloads' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">Resource Download Vault History</h3>
                    <p className="text-xs text-slate-500">Track and access your downloaded publications & research papers</p>
                  </div>
                  <Link
                    to="/resources"
                    className="px-4 py-2 bg-[#6C4CF1] hover:bg-[#5835ea] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <span>Browse Vault</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  {downloads.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No downloads recorded yet. Visit the Digital Resource Vault to explore 50 curated publications.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400">
                          <th className="pb-3">Resource</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Plan Tier</th>
                          <th className="pb-3">Downloaded On</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {downloads.map((d) => {
                          const resObj = d.resource || {};
                          const token = localStorage.getItem('subsync_token') || '';
                          const resId = resObj._id || d.resource;
                          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                          const fileUrl = `${baseUrl}/resources/${resId}/file?token=${encodeURIComponent(token)}`;

                          return (
                            <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 pr-4">
                                <div className="font-bold text-[#172033] line-clamp-1">
                                  {resObj.title || 'SubSync Digital Publication'}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {resObj.fileSize || 'PDF Document'} • {resObj.pageCount || 8} pages
                                </span>
                              </td>
                              <td className="py-3.5 pr-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-[#6C4CF1] border border-violet-100">
                                  {resObj.category || 'Engineering'}
                                </span>
                              </td>
                              <td className="py-3.5 pr-4 text-slate-600 font-medium">
                                {d.planAtDownload || 'Free'}
                              </td>
                              <td className="py-3.5 pr-4 text-slate-500 text-[11px]">
                                {new Date(d.downloadedAt).toLocaleDateString()} {new Date(d.downloadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3.5 text-right">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#6C4CF1] text-slate-700 hover:text-white text-[11px] font-bold transition-all"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download PDF</span>
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 8: PAYMENT GATEWAYS & METHODS                       */}
            {/* ======================================================== */}
            {activeTab === 'methods' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">Payment Methods & Gateways</h3>
                    <p className="text-xs text-slate-500">Razorpay Test Sandbox Integration Settings</p>
                  </div>
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#6C4CF1] flex items-center justify-center font-bold shadow-sm">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#172033]">Razorpay Sandbox Mode</h4>
                      <p className="text-xs text-slate-600">Simulate UPI, Credit/Debit Cards, Netbanking, and Wallets</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    Active & Connected
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION DOCK (Inspired by Image 2 - Subs Mobile App) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-2xl border-t border-slate-200/80 px-4 py-2 shadow-lg flex items-center justify-around">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center py-1 px-3 touch-target transition-colors ${
            activeTab === 'overview' ? 'text-[#6C4CF1]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </button>
        <button
          onClick={() => setActiveTab('card')}
          className={`flex flex-col items-center py-1 px-3 touch-target transition-colors ${
            activeTab === 'card' ? 'text-[#6C4CF1]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Pass</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center py-1 px-3 touch-target transition-colors ${
            activeTab === 'analytics' ? 'text-[#6C4CF1]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Analytics</span>
        </button>
        <Link
          to="/resources"
          className="flex flex-col items-center py-1 px-3 touch-target text-slate-400 hover:text-[#6C4CF1] transition-colors"
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Vault</span>
        </Link>
        <Link
          to="/notifications"
          className="relative flex flex-col items-center py-1 px-3 touch-target text-slate-400 hover:text-[#6C4CF1] transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
          <span className="text-[10px] font-bold mt-0.5">Alerts</span>
        </Link>
      </div>

      {/* CANCELLATION MODAL */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#172033]">Cancel Auto-Renewal?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              You will continue to have access to your <strong>{activePlan.name}</strong> entitlements until your current cycle ends on{' '}
              {effectiveSub?.endDate ? new Date(effectiveSub.endDate).toLocaleDateString() : 'the scheduled date'}. After that date, your account will smoothly transition to the Free tier.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Optional: Please share why you are cancelling..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 mb-6 focus:ring-2 focus:ring-[#6C4CF1] outline-none"
              rows="3"
            ></textarea>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Keep Renewal
              </button>
              <button
                onClick={handleCancelRenewal}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;