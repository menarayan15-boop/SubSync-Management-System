import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { getApiBaseUrl } from '../../services/api';
import { StatusBadge, TierBadge } from '../../components/common/Badge';
import {
  CreditCard,
  FileText,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const BillingPage = () => {
  const { user, subscription, refreshUser } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [invRes, payRes] = await Promise.all([
        api.get('/invoices/my-invoices'),
        api.get('/payments/my-payments'),
      ]);

      if (invRes.data.success) {
        setInvoices(invRes.data.invoices);
      }
      if (payRes.data.success) {
        setPayments(payRes.data.payments);
      }
    } catch (err) {
      console.error('Failed to load billing history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (e) => {
    e.preventDefault();
    try {
      setCancelLoading(true);
      const res = await api.post('/subscriptions/cancel', {
        reason: cancellationReason || 'Cancelled by customer from billing dashboard',
      });

      if (res.data.success) {
        setAlert({
          type: 'success',
          text: 'Subscription cancelled. Access remains active until current billing cycle concludes.',
        });
        setCancelModalOpen(false);
        await refreshUser();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel subscription.',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const activePlan = subscription?.plan || { name: 'Free', tierLevel: 0 };
  const isFreePlan = activePlan.slug === 'free' || activePlan.name === 'Free';

  const handleDownloadInvoice = (invoiceId) => {
    const token = localStorage.getItem('subsync_token') || '';
    const baseUrl = getApiBaseUrl();
    window.open(`${baseUrl}/invoices/${invoiceId}/download?token=${encodeURIComponent(token)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Subscription & Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your payment methods, view Razorpay receipts, and download GST tax invoices.
          </p>
        </div>

        <Link
          to="/plans"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white shadow-soft transition-all"
        >
          <span>Change Membership Tier</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
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
          <div className="flex items-center space-x-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alert.text}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Active Subscription Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-xl font-bold text-navy-900">{activePlan.name} Membership</h3>
                <StatusBadge status={subscription?.status || 'Active'} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Billed {subscription?.billingCycle || 'Yearly'} • Auto-renew{' '}
                {subscription?.autoRenew ? 'enabled' : 'disabled'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isFreePlan && subscription?.status === 'Active' && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel Subscription
              </button>
            )}
            <Link
              to="/plans"
              className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition-all shadow-soft"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>

        {/* Subscription Meta Dates */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider font-semibold">Start Date</span>
            <p className="text-sm font-bold text-navy-900 mt-0.5">
              {subscription?.startDate
                ? new Date(subscription.startDate).toLocaleDateString()
                : 'Account Creation'}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider font-semibold">Billing Period End</span>
            <p className="text-sm font-bold text-navy-900 mt-0.5">
              {subscription?.endDate
                ? new Date(subscription.endDate).toLocaleDateString()
                : 'Perpetual (Free Plan)'}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider font-semibold">Recurring Amount</span>
            <p className="text-sm font-bold text-navy-900 mt-0.5">
              {subscription?.amount ? `₹${subscription.amount.toLocaleString()}` : 'Free'}
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider font-semibold">Payment Engine</span>
            <p className="text-sm font-bold text-navy-900 mt-0.5 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 mr-1" />
              Razorpay Verified
            </p>
          </div>
        </div>
      </div>

      {/* Invoices & Billing History Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-navy-900 text-base">Invoices & Tax Receipts</h3>
            <p className="text-xs text-slate-500">Official GST-compliant receipts generated by SubSync</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-700">
            {invoices.length} Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          {invoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No invoices generated yet. Invoices appear automatically upon completing a plan subscription.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Plan Tier</th>
                  <th className="py-3 px-6">Issue Date</th>
                  <th className="py-3 px-6">Subtotal</th>
                  <th className="py-3 px-6">GST (18%)</th>
                  <th className="py-3 px-6">Total Paid</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-navy-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold">{inv.planName} Plan</td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">₹{inv.subtotal?.toFixed(2)}</td>
                    <td className="py-4 px-6 text-slate-500">₹{inv.taxAmount?.toFixed(2)}</td>
                    <td className="py-4 px-6 font-bold text-navy-900">₹{inv.total?.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(inv._id)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print / PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-soft-lg space-y-5 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-navy-900">Cancel Your Membership?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You will retain full access to your{' '}
                <strong>{activePlan.name}</strong> perks and download limits until{' '}
                <strong>
                  {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'end of cycle'}
                </strong>
                . After that, your account will revert to the Free plan.
              </p>
            </div>

            <form onSubmit={handleCancelSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for cancellation (optional):
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Tell us what we could improve..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Keep Subscription
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-soft"
                >
                  {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
