import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ShieldCheck,
  CreditCard,
  Clock,
  Lock,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserX,
  RefreshCw,
  LogOut,
  Laptop,
  Smartphone,
  Eye,
  ShieldAlert,
} from 'lucide-react';

const TrustCenterPage = () => {
  const [activeTab, setActiveTab] = useState('payments'); // 'payments', 'timeline', 'security', 'privacy'
  const [trustData, setTrustData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [revokingSessions, setRevokingSessions] = useState(false);

  useEffect(() => {
    fetchTrustData();
  }, []);

  const fetchTrustData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trust/overview');
      if (res.data?.success) {
        setTrustData(res.data.trustData);
      }
    } catch (err) {
      console.error('Failed to load trust center data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (invoiceId) => {
    const token = localStorage.getItem('subsync_token') || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${baseUrl}/invoices/${invoiceId}/download?token=${encodeURIComponent(token)}`, '_blank');
  };

  const handleExportData = () => {
    const token = localStorage.getItem('subsync_token') || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${baseUrl}/trust/export-data?token=${encodeURIComponent(token)}`, '_blank');
  };

  const handleRevokeSessions = async () => {
    try {
      setRevokingSessions(true);
      const res = await api.post('/trust/revoke-sessions');
      if (res.data?.success) {
        setAlert({ type: 'success', text: res.data.message });
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Failed to revoke other sessions.' });
    } finally {
      setRevokingSessions(false);
    }
  };

  const handleRequestDeletion = async (e) => {
    e.preventDefault();
    if (deleteConfirmation !== 'DELETE') {
      setAlert({ type: 'error', text: 'Please type DELETE in capital letters to confirm.' });
      return;
    }

    try {
      const res = await api.post('/trust/request-deletion', {
        confirmation: true,
        reason: deleteReason,
      });

      if (res.data?.success) {
        setDeleteModalOpen(false);
        setAlert({ type: 'success', text: res.data.message });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit deletion request.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center text-[#6C4CF1] animate-spin mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-[#172033]">Securing Cryptographic Telemetry...</h3>
      </div>
    );
  }

  const { payments = [], securityActivities = [], subscriptionTimeline = [], user = {} } =
    trustData || {};

  return (
    <div className="min-h-screen py-8 sm:py-12 text-[#172033]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* HERO HEADER */}
        <div className="p-6 sm:p-8 liquid-glass rounded-3xl border border-white/80 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-400/10 via-teal-400/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#0D9488] text-white flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                SubSync Trust Center
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] mt-1 tracking-tight">
                Trust & Security Center
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete payment transparency, chronological activity audits, session security, and GDPR-compliant data export.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={handleExportData}
              className="touch-target px-4 py-2.5 rounded-xl text-xs font-bold bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Personal Archive</span>
            </button>
          </div>
        </div>

        {/* ALERT */}
        {alert && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
              alert.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {alert.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              <span>{alert.text}</span>
            </div>
            <button onClick={() => setAlert(null)} className="font-bold">×</button>
          </div>
        )}

        {/* TABS SELECTOR */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'payments', label: 'Payment Transparency', icon: CreditCard },
            { id: 'timeline', label: 'Activity Timeline', icon: Clock },
            { id: 'security', label: 'Account Security & Logins', icon: Lock },
            { id: 'privacy', label: 'Data & Privacy Controls', icon: FileText },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`touch-target px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
                  active
                    ? 'bg-[#6C4CF1] text-white shadow-md'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PAYMENT TRANSPARENCY                              */}
        {/* ======================================================== */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-[#172033]">Official Payment Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete transactional history with Order IDs, Razorpay references, and GST tax receipts.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">{payments.length} Transactions</span>
            </div>

            {payments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No billing transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Order ID</th>
                      <th className="py-3 px-3">Payment ID</th>
                      <th className="py-3 px-3">Plan</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Tax Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-semibold text-slate-700">{p.orderId}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-500">{p.paymentId}</td>
                        <td className="py-3.5 px-3 font-bold text-[#172033]">{p.planName}</td>
                        <td className="py-3.5 px-3 font-bold text-[#172033]">₹{p.amount?.toLocaleString()}</td>
                        <td className="py-3.5 px-3 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'Successful' || p.status === 'Success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {p.hasInvoice ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(p.invoiceId)}
                              className="text-[#6C4CF1] hover:underline font-bold"
                            >
                              Download PDF
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SUBSCRIPTION ACTIVITY TIMELINE                   */}
        {/* ======================================================== */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-[#172033]">Subscription Lifecycle Timeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audited progression of activations, renewals, tier changes, downloads, and gift events.
              </p>
            </div>

            {subscriptionTimeline.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No activity recorded in the timeline yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {subscriptionTimeline.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#6C4CF1] ring-4 ring-violet-100"></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#172033]">{item.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ACCOUNT SECURITY & LOGINS                        */}
        {/* ======================================================== */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-[#172033]">Recent Security & Authentication Events</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit records of logins, device profiles, and password verification events.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRevokeSessions}
                disabled={revokingSessions}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{revokingSessions ? 'Revoking...' : 'Revoke Other Sessions'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {securityActivities.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#6C4CF1]">
                      {log.device?.toLowerCase().includes('android') || log.device?.toLowerCase().includes('ios') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#172033]">{log.action}</p>
                      <p className="text-[11px] text-slate-500">{log.device} • IP: {log.ipAddress}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DATA & PRIVACY CONTROLS                          */}
        {/* ======================================================== */}
        {activeTab === 'privacy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-in fade-in">
            {/* Download Data Archive */}
            <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-[#172033]">Export Personal Account Archive</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download a complete JSON export of your personal profile, active and past subscriptions, transaction ledger, learning milestones, and gift purchases pursuant to digital data portability rights.
              </p>
              <button
                type="button"
                onClick={handleExportData}
                className="px-5 py-2.5 rounded-xl text-xs font-bold liquid-button shadow-md flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Archive (.JSON)</span>
              </button>
            </div>

            {/* Account Deletion Request */}
            <div className="liquid-glass rounded-3xl border border-rose-200 shadow-glass p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <UserX className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-rose-900">Request Account Deletion</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Permanently close your SubSync user profile. In compliance with GST & corporate financial audit statutes, official transaction tax receipts are retained for required statutory periods.
              </p>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Submit Deletion Request</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ACCOUNT DELETION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-rose-600 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-black text-lg text-[#172033]">Confirm Deletion Request</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              This action initiates account closure. If you currently have an active paid subscription, you must cancel auto-renewal first.
            </p>

            <form onSubmit={handleRequestDeletion} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Reason for leaving (Optional)
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Switched roles / project completed"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Type <span className="font-mono text-rose-600 font-black">DELETE</span> to confirm *
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full text-xs font-mono font-bold p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmation !== 'DELETE'}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50"
                >
                  Submit Closure Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustCenterPage;

