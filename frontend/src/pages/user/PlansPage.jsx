import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Zap,
  Lock,
  X,
  Award,
  Clock,
  Tv,
} from 'lucide-react';

const PlansPage = () => {
  const { user, subscription, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);

  const [paymentState, setPaymentState] = useState('idle'); // idle | processing | awaiting_payment | verifying | successful | failed | cancelled
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => resolve(false);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = (plan) => {
    if (billingCycle === 'yearly') return plan.yearlyPrice;
    if (billingCycle === 'quarterly') return plan.quarterlyPrice;
    return plan.monthlyPrice;
  };

  const currentPlanSlug = subscription?.plan?.slug || 'free';

  // Handle plan click: open checkout modal
  const handlePlanClick = (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setConfigError(null);
    setStatusMessage(null);
    setPaymentState('idle');
    setSelectedPlanForCheckout(plan);
  };

  // Execute Razorpay Checkout from modal
  const handleConfirmPayment = async () => {
    const plan = selectedPlanForCheckout;
    if (!plan) return;

    const price = getPlanPrice(plan);

    // Free plan activation (No payment required)
    if (price === 0 || plan.slug === 'free') {
      try {
        setCheckoutLoading(true);
        const res = await api.post('/payments/activate-free');
        if (res.data.success) {
          setStatusMessage({
            type: 'success',
            text: 'You have successfully switched to the Free Plan.',
          });
          setSelectedPlanForCheckout(null);
          await refreshUser();
          navigate('/dashboard');
        }
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: err.response?.data?.message || 'Failed to activate plan.',
        });
      } finally {
        setCheckoutLoading(false);
      }
      return;
    }

    // REAL Razorpay Checkout Flow (NO SIMULATION)
    try {
      setCheckoutLoading(true);
      setPaymentState('processing');
      setStatusMessage(null);
      setConfigError(null);

      // Verify Razorpay Checkout SDK is ready
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        setPaymentState('failed');
        setStatusMessage({
          type: 'error',
          text: 'Unable to load Razorpay Checkout SDK. Please check your internet connection or ad-blocker.',
        });
        setCheckoutLoading(false);
        return;
      }

      // Step 1: Create Genuine Razorpay Test Order on Backend
      let orderRes;
      try {
        orderRes = await api.post('/payments/create-order', {
          planId: plan._id,
          billingCycle,
        });
      } catch (orderErr) {
        setCheckoutLoading(false);
        setPaymentState('failed');

        const errCode = orderErr.response?.data?.code;
        const errStatus = orderErr.response?.status;
        const errMsg = orderErr.response?.data?.message;

        if (
          errCode === 'RAZORPAY_CONFIG_REQUIRED' ||
          errCode === 'RAZORPAY_AUTH_FAILED' ||
          errCode === 'NETWORK_CONNECTIVITY_ERROR' ||
          errStatus === 503 ||
          errStatus === 401
        ) {
          setConfigError(
            errMsg ||
              'Razorpay Test Mode credentials require configuration. Please set your valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env and VITE_RAZORPAY_KEY_ID in frontend/.env from https://dashboard.razorpay.com/app/keys.'
          );
          return;
        }

        setStatusMessage({
          type: 'error',
          text: errMsg || 'Failed to initiate Razorpay test order.',
        });
        return;
      }

      const { orderId, amount, currency, keyId } = orderRes.data;

      const activeKey = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!activeKey) {
        setCheckoutLoading(false);
        setPaymentState('failed');
        setConfigError(
          'Missing public Razorpay Key ID. Please configure RAZORPAY_KEY_ID in backend/.env or frontend/.env.'
        );
        return;
      }

      setPaymentState('awaiting_payment');

      // Sanitize customer contact to valid 10 digits for Indian payment methods (Cards, UPI, Netbanking)
      const sanitizedContact = (user.phone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';

      // Safe Diagnostic Logging (Requirement 5)
      console.log('[Razorpay Client Diagnostics] Initializing Checkout:', {
        mode: activeKey?.startsWith('rzp_test_') ? 'Test Mode' : 'Live Mode',
        keyPrefix: activeKey ? activeKey.slice(0, 12) + '...' : 'none',
        orderId,
        amount,
        currency: currency || 'INR',
        prefillContact: sanitizedContact,
        prefillEmail: user.email,
      });

      // Step 2: Open Genuine Razorpay Checkout Window (Default unconstrained payment methods: UPI, Card, Netbanking)
      const options = {
        key: activeKey,
        amount,
        currency: currency || 'INR',
        name: 'SubSync Subscriptions',
        description: `${plan.name} Plan (${billingCycle.toUpperCase()} Billing)`,
        image: `${window.location.origin}/logo.svg`,
        order_id: orderId,
        prefill: {
          name: user.name || 'SubSync Member',
          email: user.email,
          contact: sanitizedContact,
        },
        notes: {
          planId: String(plan._id),
          planName: String(plan.name),
          billingCycle: String(billingCycle),
          userId: String(user._id),
        },
        theme: {
          color: '#6C4CF1',
        },
        modal: {
          ondismiss: async function () {
            setCheckoutLoading(false);
            setPaymentState('cancelled');
            console.log('[Razorpay Client Diagnostics] Checkout modal dismissed by user.');
            setStatusMessage({
              type: 'error',
              text: 'Payment checkout was cancelled. Your current subscription tier remains unchanged.',
            });
            try {
              await api.post('/payments/failure', {
                orderId,
                reason: 'User dismissed or closed Razorpay checkout popup without completing payment',
              });
            } catch (err) {
              // Non-blocking failure telemetry
            }
          },
        },
        handler: async function (response) {
          // Step 3: Backend Cryptographic Verification with HMAC SHA-256
          setPaymentState('verifying');
          console.log('[Razorpay Client Diagnostics] Received Checkout Response:', {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id || orderId,
            hasSignature: !!response.razorpay_signature,
          });

          try {
            const verifyRes = await api.post('/payments/verify', {
              orderId: response.razorpay_order_id || orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId: plan._id,
              billingCycle,
            });

            if (verifyRes.data.success) {
              setPaymentState('successful');
              setStatusMessage({
                type: 'success',
                text: `Payment verified successfully! Welcome to ${plan.name} Tier.`,
              });
              setSelectedPlanForCheckout(null);
              await refreshUser();
              setTimeout(() => {
                navigate('/dashboard');
              }, 1200);
            }
          } catch (verifyErr) {
            setPaymentState('failed');
            console.error('[Razorpay Client Diagnostics] Verification error:', verifyErr.response?.data);
            setStatusMessage({
              type: 'error',
              text:
                verifyErr.response?.data?.message ||
                'Cryptographic payment verification failed on server. Your current subscription was not altered.',
            });
          } finally {
            setCheckoutLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', async function (failedResponse) {
        setCheckoutLoading(false);
        setPaymentState('failed');

        const errCode = failedResponse.error?.code || 'UNKNOWN_ERROR';
        const errDesc = failedResponse.error?.description || 'Transaction declined by bank or test card';
        const errReason = failedResponse.error?.reason ? ` (${failedResponse.error.reason})` : '';

        console.error('[Razorpay Client Diagnostics] Payment Failed Event:', {
          code: errCode,
          description: errDesc,
          source: failedResponse.error?.source,
          step: failedResponse.error?.step,
          reason: failedResponse.error?.reason,
          metadata: failedResponse.error?.metadata,
        });

        setStatusMessage({
          type: 'error',
          text: `Payment Failed [${errCode}]: ${errDesc}${errReason}. Your current subscription tier remains unchanged.`,
        });

        try {
          await api.post('/payments/failure', {
            orderId,
            paymentId: failedResponse.error?.metadata?.payment_id,
            reason: `${errDesc}${errReason}`,
          });
        } catch (err) {
          // Non-blocking failure telemetry
        }
      });

      rzp.open();
    } catch (err) {
      console.error('Subscription error:', err);
      setPaymentState('failed');
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'An unexpected error occurred while starting payment.',
      });
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-[#172033] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 bg-violet-50 border border-violet-200 px-3.5 py-1 rounded-full text-xs font-semibold text-[#6C4CF1]">
            <Sparkles className="w-3.5 h-3.5 text-[#6C4CF1]" />
            <span>Configurable SaaS Memberships</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
            Flexible Plans for Every Stage
          </h1>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Scale streaming quality up to 4K Ultra HD, download quotas, and exclusive masterclasses.
          </p>

          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center justify-center space-x-2.5 max-w-lg mx-auto ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Billing Cycle Selector */}
          <div className="pt-2">
            <div className="inline-flex items-center p-1.5 bg-slate-100 border border-slate-200 rounded-2xl shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-[#172033] shadow-sm'
                    : 'text-slate-600 hover:text-[#172033]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('quarterly')}
                className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  billingCycle === 'quarterly'
                    ? 'bg-white text-[#172033] shadow-sm'
                    : 'text-slate-600 hover:text-[#172033]'
                }`}
              >
                Quarterly (10% Off)
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-[#172033] shadow-sm'
                    : 'text-slate-600 hover:text-[#172033]'
                }`}
              >
                Yearly
                <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-violet-100 text-[#6C4CF1] font-bold rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Plans Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = getPlanPrice(plan);
            const isCurrent = currentPlanSlug === plan.slug;
            const isRecommended = plan.slug === 'silver' || plan.isRecommended;
            const isGold = plan.slug === 'gold';

            return (
              <div
                key={plan._id}
                className={`relative flex flex-col justify-between p-7 rounded-3xl transition-all ${
                  isGold
                    ? 'animated-gradient-border shadow-gold-glow'
                    : isRecommended
                    ? 'liquid-glass border-2 border-[#6C4CF1] ring-4 ring-[#6C4CF1]/15 shadow-violet-glow'
                    : 'glass-card'
                }`}
              >
                {isGold ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-md flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Ultimate Tier VIP</span>
                  </div>
                ) : isRecommended ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#6C4CF1] to-[#4F46E5] text-white text-[10px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-md">
                    Most Popular
                  </div>
                ) : null}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xl font-black text-[#172033] tracking-tight">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 min-h-[36px] mt-1">{plan.tagline}</p>

                  <div className="my-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black text-[#172033]">
                        {price === 0 ? '₹0' : `₹${price.toLocaleString()}`}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ml-1.5">
                        /{billingCycle === 'yearly' ? 'yr' : billingCycle === 'quarterly' ? 'qtr' : 'mo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6C4CF1] font-bold mt-1">
                      {plan.quotas?.streamingQuality || '480p'} • {plan.quotas?.dailyDownloads || 1} dl/day
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200/60 text-xs">
                    {plan.features?.map((feat, idx) => (
                      <div key={idx} className="flex items-start">
                        {feat.included ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mr-2 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300 shrink-0 mr-2 mt-0.5" />
                        )}
                        <span className={feat.included ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                          {feat.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200/60">
                  <button
                    type="button"
                    disabled={isCurrent || checkoutLoading}
                    onClick={() => handlePlanClick(plan)}
                    className={`touch-target w-full py-3.5 px-4 rounded-2xl text-xs font-bold text-center transition-all flex items-center justify-center space-x-2 pressable ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isGold
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg'
                        : isRecommended
                        ? 'liquid-button shadow-md'
                        : 'bg-[#172033] hover:bg-[#0b111e] text-white shadow-sm'
                    }`}
                  >
                    {isCurrent ? (
                      <span>Current Active Plan</span>
                    ) : (
                      <>
                        <span>{price === 0 ? 'Activate Free' : `Select ${plan.name} Plan`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mt-12">
          <h3 className="text-xl font-bold text-[#172033] mb-2">Complete Membership Comparison</h3>
          <p className="text-xs text-slate-500 mb-6">Detailed streaming quality, watch time, and daily download allowances</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Feature / Allowance</th>
                  <th className="py-3 px-4 text-center">Free (₹0)</th>
                  <th className="py-3 px-4 text-center">Bronze (₹99)</th>
                  <th className="py-3 px-4 text-center font-bold text-[#6C4CF1]">Silver (₹199)</th>
                  <th className="py-3 px-4 text-center font-bold text-amber-600">Gold (₹299)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-semibold">Streaming Resolution</td>
                  <td className="py-3 px-4 text-center">480p SD</td>
                  <td className="py-3 px-4 text-center">720p HD</td>
                  <td className="py-3 px-4 text-center font-bold text-[#6C4CF1]">1080p Full HD</td>
                  <td className="py-3 px-4 text-center font-bold text-amber-600">4K Ultra HD</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Daily Download Quota</td>
                  <td className="py-3 px-4 text-center">1 download / day</td>
                  <td className="py-3 px-4 text-center">3 downloads / day</td>
                  <td className="py-3 px-4 text-center font-bold text-[#6C4CF1]">5 downloads / day</td>
                  <td className="py-3 px-4 text-center font-bold text-amber-600">10 downloads / day</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Watch Time Allowance</td>
                  <td className="py-3 px-4 text-center">Limited</td>
                  <td className="py-3 px-4 text-center">Increased</td>
                  <td className="py-3 px-4 text-center font-bold text-[#6C4CF1]">Extensive</td>
                  <td className="py-3 px-4 text-center font-bold text-amber-600">Extended / Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Ad Experience</td>
                  <td className="py-3 px-4 text-center text-slate-400">Standard Ads</td>
                  <td className="py-3 px-4 text-center text-slate-400">Standard Ads</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">Ad-Free</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">Ad-Free</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Premium Masterclasses & Courses</td>
                  <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-4 text-center text-xs text-slate-600">Selected Content</td>
                  <td className="py-3 px-4 text-center font-bold text-[#6C4CF1]">Exclusive Courses</td>
                  <td className="py-3 px-4 text-center font-bold text-amber-600">All Premium Courses</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Priority Content Access</td>
                  <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">GST Tax Invoice Download</td>
                  <td className="py-3 px-4 text-center"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAILED SUBSCRIPTION CHECKOUT CONFIRMATION MODAL */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6C4CF1]">Checkout Confirmation</span>
                <h3 className="text-xl font-extrabold text-[#172033] mt-0.5">
                  Confirm {selectedPlanForCheckout.name} Membership
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setPaymentState('idle');
                  setConfigError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment State Indicator Badge */}
            {paymentState !== 'idle' && (
              <div className="mt-4 p-3 rounded-2xl text-xs flex items-center space-x-2.5 font-medium border">
                {paymentState === 'processing' && (
                  <div className="bg-amber-50 text-amber-800 border-amber-200 flex items-center space-x-2 w-full p-1">
                    <div className="w-3.5 h-3.5 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin shrink-0"></div>
                    <span>Processing: Initializing secure Razorpay test order...</span>
                  </div>
                )}
                {paymentState === 'awaiting_payment' && (
                  <div className="bg-indigo-50 text-indigo-800 border-indigo-200 flex items-center space-x-2 w-full p-1">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Awaiting Payment: Complete or cancel in Razorpay Checkout modal...</span>
                  </div>
                )}
                {paymentState === 'verifying' && (
                  <div className="bg-violet-50 text-violet-800 border-violet-200 flex items-center space-x-2 w-full p-1">
                    <div className="w-3.5 h-3.5 border-2 border-[#6C4CF1]/30 border-t-[#6C4CF1] rounded-full animate-spin shrink-0"></div>
                    <span>Payment Verification Pending: Verifying HMAC cryptographic signature...</span>
                  </div>
                )}
                {paymentState === 'successful' && (
                  <div className="bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center space-x-2 w-full p-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Payment Successful: Verified! Activating subscription...</span>
                  </div>
                )}
                {paymentState === 'failed' && (
                  <div className="bg-rose-50 text-rose-800 border-rose-200 flex items-center space-x-2 w-full p-1">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Payment Failed: Current subscription remains unchanged.</span>
                  </div>
                )}
                {paymentState === 'cancelled' && (
                  <div className="bg-slate-100 text-slate-700 border-slate-200 flex items-center space-x-2 w-full p-1">
                    <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Payment Cancelled: Checkout dismissed. Current plan remains intact.</span>
                  </div>
                )}
              </div>
            )}

            {/* Configuration Error Alert */}
            {configError && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center space-x-2 font-bold text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Razorpay Credentials Configuration Required</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {configError}
                </p>
                <p className="text-[10px] text-amber-800 font-mono bg-amber-100/60 p-2 rounded-lg">
                  Set <strong>RAZORPAY_KEY_ID</strong> and <strong>RAZORPAY_KEY_SECRET</strong> in <code>backend/.env</code>, and <strong>VITE_RAZORPAY_KEY_ID</strong> in <code>frontend/.env</code>.
                </p>
              </div>
            )}

            {/* Plan Breakdown Required by Section 7 */}
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Plan Name:</span>
                <span className="font-bold text-[#172033]">{selectedPlanForCheckout.name} Plan (Tier {selectedPlanForCheckout.tierLevel})</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Subscription Duration:</span>
                <span className="font-semibold text-slate-800">
                  {billingCycle === 'yearly'
                    ? '365 Days (1 Year)'
                    : billingCycle === 'quarterly'
                    ? '90 Days (3 Months)'
                    : '30 Days (1 Month)'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Selected Billing Cycle:</span>
                <span className="font-bold text-[#172033] capitalize">{billingCycle} Billing</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Payment Method:</span>
                <span className="font-semibold text-[#6C4CF1] flex items-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Razorpay Test Gateway (UPI, Card, NetBanking)</span>
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Base Plan Price:</span>
                <span className="font-semibold text-slate-700">₹{getPlanPrice(selectedPlanForCheckout).toLocaleString()} INR</span>
              </div>

              <div className="flex justify-between py-2.5 text-sm bg-violet-50/70 p-3.5 rounded-2xl border border-violet-100 font-bold">
                <span className="text-[#172033]">Total Amount Payable:</span>
                <span className="text-[#6C4CF1] text-base">₹{getPlanPrice(selectedPlanForCheckout).toLocaleString()} INR</span>
              </div>
            </div>

            {/* Secure Payment Message Required by Section 7 */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start space-x-2.5 mb-5">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">Secure Payment Guaranteed</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  256-bit SSL encrypted transaction powered by Razorpay Test Gateway. Your current tier ({currentPlanSlug.toUpperCase()}) will remain active until payment is cryptographically verified.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setPaymentState('idle');
                  setConfigError(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Back to Plans
              </button>

              <button
                type="button"
                disabled={checkoutLoading}
                onClick={handleConfirmPayment}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#6C4CF1] hover:bg-[#5835ea] text-white shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansPage;
