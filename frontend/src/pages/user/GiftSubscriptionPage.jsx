import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Gift,
  Sparkles,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const GiftSubscriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase', 'history'
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('Enjoy this SubSync membership!');
  const [myGifts, setMyGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [successGift, setSuccessGift] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [plansRes, giftsRes] = await Promise.all([
        api.get('/plans'),
        api.get('/gifts/my-gifts'),
      ]);

      if (plansRes.data?.success) {
        // Only paid plans can be gifted
        const paidPlans = (plansRes.data.plans || []).filter((p) => p.monthlyPrice > 0);
        setPlans(paidPlans);
        if (paidPlans.length > 0) {
          setSelectedPlanId(paidPlans[0]._id);
        }
      }

      if (giftsRes.data?.success) {
        setMyGifts(giftsRes.data.gifts || []);
      }
    } catch (err) {
      console.error('Failed to load gift data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p._id === selectedPlanId) || plans[0];

  // Price computation with multi-month incentives
  const computePrice = () => {
    if (!selectedPlan) return 0;
    const base = selectedPlan.monthlyPrice * durationMonths;
    if (durationMonths === 3) return selectedPlan.quarterlyPrice || Math.round(base * 0.95);
    if (durationMonths === 6) return Math.round(base * 0.9);
    if (durationMonths === 12) return selectedPlan.yearlyPrice || Math.round(base * 0.85);
    return base;
  };

  const totalAmount = computePrice();

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Razorpay Checkout for Gift Subscription
  const handlePurchaseGift = async (e) => {
    e.preventDefault();
    if (!recipientEmail || !recipientName) {
      setAlert({ type: 'error', text: 'Please provide recipient name and email address.' });
      return;
    }

    try {
      setPurchasing(true);
      setAlert(null);

      // 1. Create order on backend
      const orderRes = await api.post('/gifts/create-order', {
        planId: selectedPlanId,
        durationMonths,
        recipientEmail,
        recipientName,
        personalMessage,
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Failed to create gift order.');
      }

      const { orderId, amount, keyId, currency } = orderRes.data;

      // 2. Open official Razorpay modal
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'SubSync Subscription Gifting',
        description: `Gift ${selectedPlan.name} Plan (${durationMonths} month(s)) for ${recipientName}`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#6C4CF1',
        },
        handler: async (response) => {
          try {
            // 3. Verify Razorpay cryptographic signature on backend
            const verifyRes = await api.post('/gifts/verify-payment', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              setSuccessGift(verifyRes.data.gift);
              setRecipientEmail('');
              setRecipientName('');
              setPersonalMessage('');
              // Refresh my gifts
              const updatedGifts = await api.get('/gifts/my-gifts');
              if (updatedGifts.data?.success) setMyGifts(updatedGifts.data.gifts);
            }
          } catch (verifyErr) {
            setAlert({
              type: 'error',
              text: verifyErr.response?.data?.message || 'Payment verification failed.',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setPurchasing(false);
          },
        },
      };

      if (!window.Razorpay) {
        // Fallback or dynamically wait for Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error('Gift checkout error:', err);
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Unable to initiate checkout.',
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 text-[#172033]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HERO BANNER */}
        <div className="mb-8 p-6 sm:p-8 liquid-glass rounded-3xl border border-white/80 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-400/10 via-purple-400/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-white flex items-center justify-center shadow-md shrink-0">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#EC4899] bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                SubSync Gifting
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] mt-1 tracking-tight">
                Gift a Subscription
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Surprise a colleague, friend, or teammate with unlocked premium publications and HD masterclasses.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center space-x-2">
            <Link
              to="/redeem-gift"
              className="touch-target px-4 py-2.5 rounded-xl text-xs font-bold bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#6C4CF1]" />
              <span>Redeem a Gift Code</span>
            </Link>
          </div>
        </div>

        {/* ALERT NOTIFICATION */}
        {alert && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs flex items-center justify-between ${
              alert.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {alert.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{alert.text}</span>
            </div>
            <button onClick={() => setAlert(null)} className="font-bold text-slate-400 hover:text-slate-600">
              ×
            </button>
          </div>
        )}

        {/* SUCCESS MODAL POPUP AFTER PURCHASE */}
        {successGift && (
          <div className="mb-8 p-6 rounded-3xl bg-emerald-50/90 border border-emerald-200/90 shadow-soft animate-in fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-base text-emerald-900">
                    Gift Subscription Created Successfully! 🎉
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Your gift code has been generated. Share this unique code with {successGift.recipientName}:
                  </p>
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="font-mono text-base font-black px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-950 tracking-wider">
                      {successGift.redemptionCode}
                    </span>
                    <button
                      onClick={() => handleCopy(successGift.redemptionCode)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-all"
                    >
                      {copiedCode === successGift.redemptionCode ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSuccessGift(null)}
                className="text-emerald-500 hover:text-emerald-700 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* TABS SELECTOR */}
        <div className="flex items-center space-x-2 mb-8">
          <button
            onClick={() => setActiveTab('purchase')}
            className={`touch-target px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'purchase'
                ? 'bg-[#6C4CF1] text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Send a Gift</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`touch-target px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'history'
                ? 'bg-[#6C4CF1] text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Purchased Gifts ({myGifts.length})</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PURCHASE GIFT FORM & LIVE PREVIEW                 */}
        {/* ======================================================== */}
        {activeTab === 'purchase' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Form: 7 cols */}
            <div className="lg:col-span-7 liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-black text-[#172033] pb-3 border-b border-slate-100">
                1. Select Subscription Tier & Duration
              </h2>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => setSelectedPlanId(p._id)}
                    className={`touch-target p-4 rounded-2xl border text-left transition-all ${
                      selectedPlanId === p._id
                        ? 'border-[#6C4CF1] bg-violet-50/80 ring-2 ring-[#6C4CF1]/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#172033]">{p.name}</span>
                      <span className="text-[10px] font-bold text-[#6C4CF1] bg-violet-100 px-2 py-0.5 rounded-full">
                        Tier {p.tierLevel}
                      </span>
                    </div>
                    <p className="text-lg font-black text-[#6C4CF1] mt-2">₹{p.monthlyPrice}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {p.quotas?.dailyDownloads || 3} downloads/day • {p.quotas?.streamingQuality || '720p'}
                    </p>
                  </button>
                ))}
              </div>

              {/* Duration Options */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Duration (Months)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { m: 1, label: '1 Month' },
                    { m: 3, label: '3 Months (5% off)' },
                    { m: 6, label: '6 Months (10% off)' },
                    { m: 12, label: '1 Year (15% off)' },
                  ].map((dur) => (
                    <button
                      key={dur.m}
                      type="button"
                      onClick={() => setDurationMonths(dur.m)}
                      className={`touch-target py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        durationMonths === dur.m
                          ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow-sm'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <h2 className="text-lg font-black text-[#172033] pt-4 pb-3 border-b border-slate-100">
                2. Recipient Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Aditi Sharma"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C4CF1] outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C4CF1] outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Personalized Message
                </label>
                <textarea
                  rows="3"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="Add a heartwarming congratulatory note or project message..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C4CF1] outline-none bg-white"
                ></textarea>
              </div>

              {/* Checkout Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
                  <span className="text-2xl font-black text-[#172033]">₹{totalAmount.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 ml-1.5 font-medium">via Razorpay</span>
                </div>

                <button
                  type="button"
                  onClick={handlePurchaseGift}
                  disabled={purchasing || !recipientName || !recipientEmail}
                  className="touch-target px-6 py-3 rounded-xl text-xs font-bold liquid-button shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{purchasing ? 'Initiating Checkout...' : 'Pay & Issue Gift Pass'}</span>
                </button>
              </div>
            </div>

            {/* Right Live Visual Gift Pass Preview: 5 cols */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Live Gift Pass Preview
              </span>

              {/* Styled Gift Pass Card */}
              <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#1C132E] via-[#2E1A47] to-[#0F0826] text-white shadow-2xl border border-pink-500/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl"></div>

                <div className="flex items-center justify-between pb-6 border-b border-white/10 relative z-10">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-5 h-5 text-pink-400" />
                    <span className="font-mono text-xs uppercase tracking-wider text-pink-300 font-bold">
                      SubSync Gift Pass
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-pink-500 text-white shadow-sm">
                    {selectedPlan?.name || 'Silver'} Tier
                  </span>
                </div>

                <div className="py-6 space-y-3 relative z-10">
                  <p className="text-[11px] text-pink-200 uppercase tracking-widest font-bold">Gifted To</p>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {recipientName || 'Recipient Name'}
                  </h3>
                  <p className="text-xs text-slate-300 italic">
                    "{personalMessage || 'Enjoy this SubSync membership!'}"
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs relative z-10 text-slate-300">
                  <div>
                    <span className="text-[10px] uppercase block text-slate-400">Duration</span>
                    <span className="font-bold text-white">{durationMonths} Month(s)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase block text-slate-400">From</span>
                    <span className="font-bold text-white">{user?.name || 'A SubSync Friend'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase block text-slate-400">Redemption</span>
                    <span className="font-mono font-bold text-pink-300">Single-Use</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-[#172033] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Security & Fraud Prevention Guarantee</span>
                </p>
                <p className="text-[11px]">
                  Gift redemption codes are generated through 256-bit cryptographic entropy and strictly single-use. Codes expire automatically after 6 months if unclaimed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MY PURCHASED GIFTS HISTORY                        */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-[#172033]">Purchased Gift Log</h3>
              <span className="text-xs font-bold text-[#6C4CF1] bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                {myGifts.length} Gifts Issued
              </span>
            </div>

            {myGifts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No gifts purchased yet. Spread the power of knowledge by sending your first gift subscription above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Redemption Code</th>
                      <th className="py-3 px-3">Recipient</th>
                      <th className="py-3 px-3">Plan</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Purchased</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myGifts.map((g) => (
                      <tr key={g._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-[#6C4CF1]">
                          {g.redemptionCode}
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-[#172033]">{g.recipientName}</p>
                          <p className="text-[10px] text-slate-400">{g.recipientEmail}</p>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700">
                          {g.plan?.name} ({g.durationMonths}mo)
                        </td>
                        <td className="py-3.5 px-3 font-bold text-[#172033]">
                          ₹{g.amount}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              g.redemptionStatus === 'Redeemed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : g.redemptionStatus === 'Expired'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-pink-50 text-pink-700 border border-pink-200'
                            }`}
                          >
                            {g.redemptionStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                          {new Date(g.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopy(g.redemptionCode)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#6C4CF1] hover:text-white font-bold text-[11px] transition-all"
                          >
                            {copiedCode === g.redemptionCode ? 'Copied' : 'Copy'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftSubscriptionPage;

