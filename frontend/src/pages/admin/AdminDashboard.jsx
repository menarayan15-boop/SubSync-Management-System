import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatusBadge, TierBadge } from '../../components/common/Badge';
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  FileText,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Shield,
  MessageSquare,
  ArrowUpRight,
  Send,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'plans', 'resources', 'payments', 'tickets'
  const [metrics, setMetrics] = useState(null);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Data lists
  const [usersList, setUsersList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [resourcesList, setResourcesList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [ticketsList, setTicketsList] = useState([]);
  const [giftsList, setGiftsList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Search & Filter filters
  const [userSearch, setUserSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');

  // Modals for Create/Edit
  const [editingPlan, setEditingPlan] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    slug: '',
    tagline: '',
    tierLevel: 1,
    monthlyPrice: 499,
    quarterlyPrice: 1299,
    yearlyPrice: 4499,
    dailyDownloads: 15,
    monthlyDownloads: 100,
  });

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    category: 'Developer SDKs & Code',
    planLevelRequired: 'Bronze',
    fileType: 'ZIP',
    fileSize: '5.0 MB',
    fileContent: 'SubSync Admin uploaded digital asset file content.',
  });

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const fetchAdminOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/overview');
      if (res.data.success) {
        setMetrics(res.data.metrics);
        setPlanDistribution(res.data.planDistribution);
        setRevenueTrend(res.data.monthlyRevenueTrend);
        setRecentActivities(res.data.recentActivities);
      }
    } catch (err) {
      console.error('Error fetching admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabContent = async (tab) => {
    setActiveTab(tab);
    setAlert(null);

    try {
      if (tab === 'users') {
        const res = await api.get('/admin/users');
        if (res.data.success) setUsersList(res.data.users);
      } else if (tab === 'plans') {
        const res = await api.get('/plans');
        if (res.data.success) setPlansList(res.data.plans);
      } else if (tab === 'resources') {
        const res = await api.get('/resources');
        if (res.data.success) setResourcesList(res.data.resources);
      } else if (tab === 'payments') {
        const res = await api.get('/admin/payments');
        if (res.data.success) setPaymentsList(res.data.payments);
      } else if (tab === 'tickets') {
        const res = await api.get('/admin/tickets');
        if (res.data.success) {
          setTicketsList(res.data.tickets);
          if (res.data.tickets.length > 0 && !selectedTicket) {
            setSelectedTicket(res.data.tickets[0]);
          }
        }
      } else if (tab === 'gifts') {
        const res = await api.get('/gifts/admin/all');
        if (res.data?.success) setGiftsList(res.data.gifts);
      } else if (tab === 'teams') {
        const res = await api.get('/team/admin/all');
        if (res.data?.success) setTeamsList(res.data.groups);
      }
    } catch (err) {
      console.error('Failed to load tab content:', err);
    }
  };

  // User Actions
  const handleToggleUserStatus = async (targetUser) => {
    try {
      const res = await api.put(`/admin/users/${targetUser._id}`, {
        isActive: !targetUser.isActive,
      });
      if (res.data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, isActive: !u.isActive } : u))
        );
        setAlert({
          type: 'success',
          text: `User ${targetUser.name} has been ${!targetUser.isActive ? 'unblocked' : 'blocked'}.`,
        });
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  const handleChangeUserRole = async (targetUser, newRole) => {
    try {
      const res = await api.put(`/admin/users/${targetUser._id}`, {
        role: newRole,
      });
      if (res.data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
        );
        setAlert({ type: 'success', text: `Updated ${targetUser.name}'s role to ${newRole}.` });
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Failed to update role.' });
    }
  };

  // Plan Actions
  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: planForm.name,
        slug: planForm.slug || planForm.name.toLowerCase().replace(/\s+/g, '-'),
        tagline: planForm.tagline,
        tierLevel: Number(planForm.tierLevel),
        monthlyPrice: Number(planForm.monthlyPrice),
        quarterlyPrice: Number(planForm.quarterlyPrice),
        yearlyPrice: Number(planForm.yearlyPrice),
        quotas: {
          dailyDownloads: Number(planForm.dailyDownloads),
          monthlyDownloads: Number(planForm.monthlyDownloads),
        },
      };

      if (editingPlan) {
        const res = await api.put(`/plans/${editingPlan._id}`, payload);
        if (res.data.success) {
          setAlert({ type: 'success', text: 'Plan updated successfully.' });
        }
      } else {
        const res = await api.post('/plans', payload);
        if (res.data.success) {
          setAlert({ type: 'success', text: 'New membership plan created.' });
        }
      }

      setIsPlanModalOpen(false);
      setEditingPlan(null);
      loadTabContent('plans');
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || 'Failed to save plan.' });
    }
  };

  // Resource Actions
  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await api.put(`/resources/${editingResource._id}`, resourceForm);
        setAlert({ type: 'success', text: 'Resource updated.' });
      } else {
        await api.post('/resources', resourceForm);
        setAlert({ type: 'success', text: 'Resource created and published.' });
      }
      setIsResourceModalOpen(false);
      setEditingResource(null);
      loadTabContent('resources');
    } catch (err) {
      setAlert({ type: 'error', text: 'Failed to save resource.' });
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm('Delete this resource permanently?')) {
      try {
        await api.delete(`/resources/${id}`);
        setResourcesList((prev) => prev.filter((r) => r._id !== id));
        setAlert({ type: 'success', text: 'Resource removed.' });
      } catch (err) {
        setAlert({ type: 'error', text: 'Failed to delete resource.' });
      }
    }
  };

  // Payment Refund Action
  const handleRefundPayment = async (paymentId) => {
    if (window.confirm('Process full refund for this transaction?')) {
      try {
        const res = await api.post(`/admin/payments/${paymentId}/refund`);
        if (res.data.success) {
          setPaymentsList((prev) =>
            prev.map((p) => (p._id === paymentId ? { ...p, status: 'Refunded' } : p))
          );
          setAlert({ type: 'success', text: 'Payment refunded successfully.' });
        }
      } catch (err) {
        setAlert({ type: 'error', text: err.response?.data?.message || 'Failed to process refund.' });
      }
    }
  };

  // Ticket Reply & Status Actions
  const handleAdminTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReply.trim() || !selectedTicket) return;

    try {
      const res = await api.post(`/support/${selectedTicket._id}/reply`, {
        message: ticketReply,
      });
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
        setTicketReply('');
        setTicketsList((prev) =>
          prev.map((t) => (t._id === res.data.ticket._id ? res.data.ticket : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const res = await api.put(`/admin/tickets/${ticketId}/status`, { status: newStatus });
      if (res.data.success) {
        setSelectedTicket((prev) => (prev?._id === ticketId ? { ...prev, status: newStatus } : prev));
        setTicketsList((prev) =>
          prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const PIE_COLORS = ['#94a3b8', '#ea580c', '#0d9488', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-soft-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Master Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            SubSync Operations Management
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time subscriber telemetry, configurable membership pricing, payment audits, and customer support.
          </p>
        </div>

        <button
          onClick={fetchAdminOverview}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-soft ${
            alert.type === 'success'
              ? 'bg-teal-50 text-teal-800 border border-teal-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-bold">
        {[
          { key: 'overview', label: 'Platform Overview' },
          { key: 'users', label: 'User Directory' },
          { key: 'plans', label: 'Plan & Quota Config' },
          { key: 'resources', label: 'Digital Vault Assets' },
          { key: 'payments', label: 'Transactions & Refunds' },
          { key: 'gifts', label: 'Gift Monitoring' },
          { key: 'teams', label: 'Family & Teams' },
          { key: 'tickets', label: 'Support Helpdesk' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => loadTabContent(tab.key)}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 ${
              activeTab === tab.key
                ? 'bg-navy-900 text-white shadow-soft'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Users</span>
              <p className="text-3xl font-black text-navy-900 mt-1">
                {metrics?.totalUsers?.toLocaleString() || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">Registered accounts in MongoDB</p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Active Subscribers</span>
              <p className="text-3xl font-black text-brand-600 mt-1">
                {metrics?.activeSubscribers?.toLocaleString() || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                {metrics?.paidSubscribers || 0} Paid • {metrics?.freeUsers || 0} Free
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Revenue</span>
              <p className="text-3xl font-black text-navy-900 mt-1">
                ₹{metrics?.totalRevenue?.toLocaleString() || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Monthly: ₹{metrics?.monthlyRevenue?.toLocaleString() || 0}
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-soft">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Open Tickets</span>
              <p className="text-3xl font-black text-amber-600 mt-1">
                {metrics?.openTickets || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">Awaiting helpdesk response</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-soft">
              <h3 className="font-bold text-navy-900 text-base mb-1">Monthly Revenue Trend (INR)</h3>
              <p className="text-xs text-slate-500 mb-6">Payment volume verified via Razorpay engine</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0f172a"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#revGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Distribution Pie Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-soft flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-navy-900 text-base mb-1">Plan Distribution</h3>
                <p className="text-xs text-slate-500 mb-4">Active memberships across tiers</p>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={45}
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                {planDistribution.map((p, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    ></span>
                    <span className="text-slate-600 truncate">{p.name}: {p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-navy-900 text-base">Registered Users ({usersList.length})</h3>
              <p className="text-xs text-slate-500">Inspect user accounts, manage roles, and toggle access</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Current Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <p className="font-bold text-navy-900">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeUserRole(u, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <TierBadge tier={u.currentPlan} />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          u.isActive
                            ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {u.isActive ? 'Block' : 'Unblock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PLAN & QUOTA CONFIG */}
      {/* ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-navy-900 text-base">Subscription Plans Configuration</h3>
              <p className="text-xs text-slate-500">Configure prices, download limits, and quotas</p>
            </div>
            <button
              onClick={() => {
                setEditingPlan(null);
                setPlanForm({
                  name: '',
                  slug: '',
                  tagline: '',
                  tierLevel: 1,
                  monthlyPrice: 499,
                  quarterlyPrice: 1299,
                  yearlyPrice: 4499,
                  dailyDownloads: 15,
                  monthlyDownloads: 100,
                });
                setIsPlanModalOpen(true);
              }}
              className="px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold shadow-soft flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Create Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plansList.map((plan) => (
              <div key={plan._id} className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-bold text-navy-900">{plan.name}</h4>
                  <TierBadge tier={plan.name} />
                </div>
                <p className="text-xs text-slate-500">{plan.tagline || 'Configured plan'}</p>

                <div className="space-y-1 text-xs">
                  <p><strong>Monthly:</strong> ₹{plan.monthlyPrice}</p>
                  <p><strong>Quarterly:</strong> ₹{plan.quarterlyPrice}</p>
                  <p><strong>Yearly:</strong> ₹{plan.yearlyPrice}</p>
                  <p className="text-brand-700 font-semibold pt-1">
                    Daily Quota: {plan.quotas?.dailyDownloads} files/day
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setPlanForm({
                        name: plan.name,
                        slug: plan.slug,
                        tagline: plan.tagline || '',
                        tierLevel: plan.tierLevel,
                        monthlyPrice: plan.monthlyPrice,
                        quarterlyPrice: plan.quarterlyPrice,
                        yearlyPrice: plan.yearlyPrice,
                        dailyDownloads: plan.quotas?.dailyDownloads || 5,
                        monthlyDownloads: plan.quotas?.monthlyDownloads || 30,
                      });
                      setIsPlanModalOpen(true);
                    }}
                    className="p-2 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-lg text-xs"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DIGITAL VAULT ASSETS */}
      {/* ========================================================================= */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-navy-900 text-base">Digital Assets Library</h3>
              <p className="text-xs text-slate-500">Publish reports, code templates, and design kits</p>
            </div>
            <button
              onClick={() => {
                setEditingResource(null);
                setResourceForm({
                  title: '',
                  description: '',
                  category: 'Developer SDKs & Code',
                  planLevelRequired: 'Bronze',
                  fileType: 'ZIP',
                  fileSize: '5.0 MB',
                  fileContent: 'SubSync Admin uploaded digital asset file content.',
                });
                setIsResourceModalOpen(true);
              }}
              className="px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold shadow-soft flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Access Level</th>
                    <th className="py-3 px-4">Type / Size</th>
                    <th className="py-3 px-4">Downloads</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {resourcesList.map((res) => (
                    <tr key={res._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-navy-900 max-w-xs truncate">
                        {res.title}
                      </td>
                      <td className="py-3 px-4">{res.category}</td>
                      <td className="py-3 px-4">
                        <TierBadge tier={res.planLevelRequired} />
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {res.fileType} • {res.fileSize}
                      </td>
                      <td className="py-3 px-4 font-semibold">{res.downloadCount}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteResource(res._id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TRANSACTIONS & REFUNDS */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-navy-900 text-base">Razorpay Transaction Ledger</h3>
              <p className="text-xs text-slate-500">Cryptographically verified payment events and refund controls</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paymentsList.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-navy-900">{p.orderId}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{p.user?.name || 'Customer'}</p>
                      <p className="text-[10px] text-slate-400">{p.user?.email}</p>
                    </td>
                    <td className="py-3 px-4">{p.plan?.name}</td>
                    <td className="py-3 px-4 font-bold text-navy-900">₹{p.amount?.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'Successful' && (
                        <button
                          onClick={() => handleRefundPayment(p._id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SUPPORT HELPDESK */}
      {/* ========================================================================= */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-5 space-y-3">
            <h3 className="font-bold text-navy-900 text-sm">Customer Inquiries ({ticketsList.length})</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {ticketsList.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-3 rounded-2xl cursor-pointer border ${
                    selectedTicket?._id === ticket._id
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{ticket.ticketNumber}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-xs font-bold text-navy-900 line-clamp-1">{ticket.subject}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ticket.user?.name} ({ticket.user?.email})</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-soft p-6 flex flex-col justify-between min-h-[500px]">
            {selectedTicket ? (
              <>
                <div className="pb-4 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-500">{selectedTicket.ticketNumber}</span>
                    <h3 className="text-base font-bold text-navy-900 mt-1">{selectedTicket.subject}</h3>
                    <p className="text-xs text-slate-500">From: {selectedTicket.user?.name} ({selectedTicket.user?.email})</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateTicketStatus(selectedTicket._id, e.target.value)}
                      className="text-xs border border-slate-300 rounded-lg px-2 py-1 font-semibold"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="py-4 flex-1 space-y-3 overflow-y-auto max-h-[350px]">
                  {selectedTicket.responses?.map((r, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl text-xs max-w-md ${
                        r.isAdmin
                          ? 'bg-navy-900 text-white ml-auto'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="font-bold text-[11px] mb-1">{r.isAdmin ? 'You (Admin)' : selectedTicket.user?.name}</p>
                      <p>{r.message}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAdminTicketReply} className="pt-4 border-t border-slate-100 flex space-x-2">
                  <input
                    type="text"
                    value={ticketReply}
                    onChange={(e) => setTicketReply(e.target.value)}
                    placeholder="Type official admin response..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold shadow-soft"
                  >
                    Reply
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center text-slate-400 text-xs my-auto">Select a ticket to inspect and respond.</div>
            )}
          </div>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Edit/Create Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 border border-slate-200 shadow-soft-lg">
            <h3 className="text-lg font-bold text-navy-900">
              {editingPlan ? 'Edit Membership Plan' : 'Create New Plan'}
            </h3>
            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Monthly (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.monthlyPrice}
                    onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Quarterly (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.quarterlyPrice}
                    onChange={(e) => setPlanForm({ ...planForm, quarterlyPrice: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Yearly (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.yearlyPrice}
                    onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Daily Downloads Quota</label>
                  <input
                    type="number"
                    required
                    value={planForm.dailyDownloads}
                    onChange={(e) => setPlanForm({ ...planForm, dailyDownloads: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Monthly Downloads Quota</label>
                  <input
                    type="number"
                    required
                    value={planForm.monthlyDownloads}
                    onChange={(e) => setPlanForm({ ...planForm, monthlyDownloads: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy-900 text-white rounded-xl font-bold"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 border border-slate-200 shadow-soft-lg">
            <h3 className="text-lg font-bold text-navy-900">
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </h3>
            <form onSubmit={handleSaveResource} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Resource Title</label>
                <input
                  type="text"
                  required
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={resourceForm.category}
                  onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="Reports & Analytics">Reports & Analytics</option>
                  <option value="Developer SDKs & Code">Developer SDKs & Code</option>
                  <option value="Design Assets & UI Kits">Design Assets & UI Kits</option>
                  <option value="Security Audit Tools">Security Audit Tools</option>
                  <option value="Templates & Checklists">Templates & Checklists</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Required Tier</label>
                <select
                  value={resourceForm.planLevelRequired}
                  onChange={(e) => setResourceForm({ ...resourceForm, planLevelRequired: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="Free">Free</option>
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsResourceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy-900 text-white rounded-xl font-bold"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GIFT SUBSCRIPTIONS MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Gift Subscriptions Issued</h3>
            <span className="text-xs font-bold text-slate-500">{giftsList.length} Total Gifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Redemption Code</th>
                  <th className="py-2.5 px-3">Purchaser</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Redemption Status</th>
                  <th className="py-2.5 px-3">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {giftsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No gift subscriptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  giftsList.map((g) => (
                    <tr key={g._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-[#6C4CF1]">{g.redemptionCode}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.purchaser?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400">{g.purchaser?.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{g.recipientName}</p>
                        <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold">{g.plan?.name} ({g.durationMonths}mo)</td>
                      <td className="py-3 px-3 font-bold">₹{g.amount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.redemptionStatus === 'Redeemed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : g.redemptionStatus === 'Expired'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {g.redemptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{new Date(g.expiresAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: FAMILY & TEAMS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">All Active Family & Team Groups</h3>
            <span className="text-xs font-bold text-slate-500">{teamsList.length} Total Groups</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Group Name</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Plan Tier</th>
                  <th className="py-2.5 px-3">Seats Allocated</th>
                  <th className="py-2.5 px-3">Active Members</th>
                  <th className="py-2.5 px-3">Shared Downloads</th>
                  <th className="py-2.5 px-3">Established Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No active Family & Team groups found.
                    </td>
                  </tr>
                ) : (
                  teamsList.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-navy-900">{t.name}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-navy-900">{t.owner?.name}</p>
                        <p className="text-[10px] text-slate-400">{t.owner?.email}</p>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#6C4CF1]">{t.plan?.name}</td>
                      <td className="py-3 px-3 font-bold">{t.seatLimit} Seats</td>
                      <td className="py-3 px-3">{t.members?.length || 1} Members</td>
                      <td className="py-3 px-3">{t.sharedDownloadsCount || 0} Downloads</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
