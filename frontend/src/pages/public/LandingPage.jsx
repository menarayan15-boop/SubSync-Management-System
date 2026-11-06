import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getDynamicTestimonials } from '../../utils/testimonialSelector';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  Users,
  CreditCard,
  BarChart3,
  HelpCircle,
  Star,
  ChevronRight,
  Sparkles,
  Lock,
  Layers,
  ChevronDown,
  RefreshCw,
  FileText,
  Clock,
  Tv,
  Check,
  Award,
  AlertCircle,
} from 'lucide-react';

const LandingPage = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans');
        if (res.data.success) {
          setPlans(res.data.plans);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchPlans();
  }, []);

  const getPrice = (plan) => {
    if (billingCycle === 'yearly') return plan.yearlyPrice;
    if (billingCycle === 'quarterly') return plan.quarterlyPrice;
    return plan.monthlyPrice;
  };

  const getPricePeriod = () => {
    if (billingCycle === 'yearly') return '/ year';
    if (billingCycle === 'quarterly') return '/ quarter';
    return '/ month';
  };

  const faqs = [
    {
      q: 'How does SubSync manage tiered streaming and download quotas?',
      a: 'SubSync calculates and enforces access dynamically based on your membership tier (Free, Bronze, Silver, or Gold). Quotas for daily downloads (1 for Free, 3 for Bronze, 5 for Silver, 10 for Gold) and streaming limits reset automatically every 24 hours at midnight.',
    },
    {
      q: 'Can I upgrade or downgrade my subscription plan at any time?',
      a: 'Yes! You can instantly upgrade your membership from your customer dashboard via our secure Razorpay test checkout. If you schedule a downgrade, you retain all current tier benefits until your active billing period concludes.',
    },
    {
      q: 'How does the Razorpay payment verification work?',
      a: 'Every transaction creates a server-validated order. When payment completes, Razorpay returns signatures that are cryptographically verified server-side using HMAC-SHA256 before your membership is activated.',
    },
    {
      q: 'Are digital downloads and invoices permanently saved?',
      a: 'Yes. Every resource you download is logged in your Download History, and every transaction generates an official GST tax invoice with a sequential invoice number (e.g., INV-2026-XXXXX) that you can print or download anytime.',
    },
    {
      q: 'What happens when a subscription expires or is cancelled?',
      a: 'If you cancel future renewals, you retain your paid entitlements until the expiry date. Upon expiry, SubSync automatically transitions your account to the Free tier without deleting your account data, billing receipts, or watch history.',
    },
  ];

  const [displayedTestimonials, setDisplayedTestimonials] = useState(() => getDynamicTestimonials(3));
  const [isTestimonialTransitioning, setIsTestimonialTransitioning] = useState(false);

  const handleShuffleTestimonials = () => {
    setIsTestimonialTransitioning(true);
    setTimeout(() => {
      setDisplayedTestimonials(getDynamicTestimonials(3));
      setIsTestimonialTransitioning(false);
    }, 200);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-[#172033]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Soft violet/indigo backdrop glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[540px] pointer-events-none opacity-50">
          <div className="w-full h-full bg-gradient-to-b from-violet-100/70 via-indigo-50/40 to-transparent blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 bg-white border border-brand-200 px-4 py-1.5 rounded-full text-xs font-semibold text-brand-700 shadow-sm">
              <Sparkles className="w-4 h-4 text-brand-600 animate-pulse" />
              <span>Smart Subscription, Payment & Membership Management Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#172033] leading-[1.15]">
              Every Subscription. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4CF1] to-[#4F46E5]">
                One Intelligent Platform.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#64748B] leading-relaxed font-normal">
              Manage memberships, simplify payments, track renewals and unlock a smarter subscription experience with SubSync.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-[#6C4CF1] hover:bg-[#5835ea] rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Go to Customer Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-[#6C4CF1] hover:bg-[#5835ea] rounded-xl shadow-md hover:shadow-lg transition-all group"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/plans"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-[#172033] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition-all"
                  >
                    Explore Plans
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* UNIQUE HERO ILLUSTRATION & FLOATING UI BADGES */}
          <div className="mt-14 relative max-w-4xl mx-auto">
            {/* Main Interactive Hero Card Deck */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 relative overflow-hidden">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="text-xs font-semibold text-slate-400 pl-2">SubSync Intelligence Hub • Live Dashboard</span>
                </div>
                <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
                  Active Sync
                </span>
              </div>

              {/* Connected Mock Dashboard Visuals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                {/* Active Membership Tier Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50/80 to-indigo-50/50 border border-violet-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6C4CF1]">Current Plan</span>
                    <span className="text-[10px] bg-[#6C4CF1] text-white px-2 py-0.5 rounded-full font-bold">Gold Tier</span>
                  </div>
                  <p className="text-2xl font-extrabold text-[#172033]">₹299<span className="text-xs font-normal text-slate-500">/mo</span></p>
                  <p className="text-xs text-slate-600 mt-1">4K Ultra HD • 10 Downloads/day</p>
                  <div className="mt-4 pt-3 border-t border-violet-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Status</span>
                    <span className="text-emerald-600 font-semibold flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                    </span>
                  </div>
                </div>

                {/* Renewal Timeline Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Renewal Cycle</span>
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#172033]">24 Days</p>
                  <p className="text-xs text-slate-600 mt-1">Next: Nov 26, 2026</p>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Auto-Renewal</span>
                    <span className="text-[#6C4CF1] font-semibold">Enabled</span>
                  </div>
                </div>

                {/* Quota & Analytics Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Daily Quota</span>
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-extrabold text-[#172033]">3</span>
                    <span className="text-xs text-slate-500 font-medium">/ 10 downloads used</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-[#6C4CF1] h-2 rounded-full w-[30%]"></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Resets daily at 00:00 IST</p>
                </div>
              </div>

              {/* Transactions & Verification Stream Mock */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Razorpay HMAC-SHA256 Cryptographic Verification: <strong>Passed</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#6C4CF1]" />
                  <span>GST Invoice <strong>#INV-2026-89241</strong> Generated</span>
                </div>
              </div>
            </div>

            {/* FLOATING UI BADGE 1: Payment Successful */}
            <div className="hidden sm:flex absolute -top-5 -left-6 bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-emerald-100 items-center space-x-2.5 animate-bounce [animation-duration:4s]">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172033]">Payment Successful</p>
                <p className="text-[10px] text-slate-500">₹299.00 via Razorpay Sandbox</p>
              </div>
            </div>

            {/* FLOATING UI BADGE 2: Subscription Renewed */}
            <div className="hidden sm:flex absolute -top-6 -right-6 bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-violet-100 items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-[#6C4CF1] flex items-center justify-center">
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172033]">Subscription Renewed</p>
                <p className="text-[10px] text-slate-500">Gold Membership Extended</p>
              </div>
            </div>

            {/* FLOATING UI BADGE 3: Premium Access Activated */}
            <div className="hidden sm:flex absolute -bottom-5 -left-8 bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-indigo-100 items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-[#4F46E5] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172033]">Premium Access Activated</p>
                <p className="text-[10px] text-slate-500">4K Streaming & All Courses</p>
              </div>
            </div>

            {/* FLOATING UI BADGE 4: Invoice Generated */}
            <div className="hidden sm:flex absolute -bottom-5 -right-6 bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200 items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172033]">Invoice Generated</p>
                <p className="text-[10px] text-slate-500">PDF Ready for Download</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUSTED SUBSCRIPTION MANAGEMENT SECTION */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-8">
            Built for Modern SaaS, Membership Hubs & Digital Media Platforms
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
              <p className="text-3xl font-extrabold text-[#6C4CF1]">4 Tiers</p>
              <p className="text-xs text-slate-500 mt-1">Free, Bronze, Silver & Gold</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
              <p className="text-3xl font-extrabold text-[#172033]">100%</p>
              <p className="text-xs text-slate-500 mt-1">Backend Enforced Quotas</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
              <p className="text-3xl font-extrabold text-[#4F46E5]">Razorpay</p>
              <p className="text-xs text-slate-500 mt-1">HMAC Cryptographic Checkout</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
              <p className="text-3xl font-extrabold text-[#16A34A]">GST Invoices</p>
              <p className="text-xs text-slate-500 mt-1">Sequential & Tax Ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW SUBSYNC WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6C4CF1] mb-2">How It Works</h2>
            <h3 className="text-3xl font-bold text-[#172033]">Simple, Seamless Lifecycle Management</h3>
            <p className="text-slate-600 text-sm mt-2">
              From free onboarding to high-scale tier privileges, everything runs in complete synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 transition-all shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-[#6C4CF1] flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                01
              </div>
              <h4 className="text-lg font-bold text-[#172033] mb-2">1. Explore & Select</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Choose between Free, Bronze (₹99), Silver (₹199), or Gold (₹299) plans with monthly, quarterly, or yearly discount billing.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 transition-all shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-[#4F46E5] flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                02
              </div>
              <h4 className="text-lg font-bold text-[#172033] mb-2">2. Secure Verification</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pay effortlessly via Razorpay test sandbox. Signatures are verified server-side with zero risk of duplicate activation.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 transition-all shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                03
              </div>
              <h4 className="text-lg font-bold text-[#172033] mb-2">3. Instant Privileges</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Streaming quality unlocks (up to 4K), download quotas expand immediately, and formal GST invoices are generated for download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SUBSCRIPTION PLAN COMPARISON SECTION */}
      <section id="plans" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6C4CF1] mb-2">Pricing & Memberships</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-[#172033]">
              Transparent Plans for Every Need
            </h3>
            <p className="text-slate-600 text-sm mt-3">
              Configure, subscribe, or upgrade effortlessly with automated entitlement tracking.
            </p>

            {/* Billing Cycle Selector */}
            <div className="mt-8 inline-flex items-center p-1.5 bg-slate-100 border border-slate-200 rounded-2xl shadow-inner">
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

          {/* 4 Membership Plans Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const price = getPrice(plan);
              const isRecommended = plan.slug === 'silver' || plan.isRecommended;
              const isGold = plan.slug === 'gold';

              return (
                <div
                  key={plan._id}
                  className={`relative flex flex-col justify-between p-7 rounded-2xl bg-white transition-all shadow-sm hover:shadow-lg ${
                    isGold
                      ? 'border-2 border-amber-400 ring-4 ring-amber-400/10'
                      : isRecommended
                      ? 'border-2 border-[#6C4CF1] ring-4 ring-[#6C4CF1]/10'
                      : 'border border-slate-200'
                  }`}
                >
                  {isGold ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-bold uppercase tracking-wider py-1 px-3.5 rounded-full shadow-sm flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>Ultimate Privilege</span>
                    </div>
                  ) : isRecommended ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#6C4CF1] text-white text-[11px] font-bold uppercase tracking-wider py-1 px-3.5 rounded-full shadow-sm">
                      Most Popular
                    </div>
                  ) : null}

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xl font-bold text-[#172033]">{plan.name}</h4>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        Tier {plan.tierLevel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 min-h-[36px]">{plan.tagline}</p>

                    <div className="my-6">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-extrabold text-[#172033]">
                          {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
                        </span>
                        {price > 0 && (
                          <span className="text-xs font-medium text-slate-500 ml-1.5">
                            {getPricePeriod()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6C4CF1] font-semibold mt-1">
                        {plan.quotas?.streamingQuality || '480p'} streaming • {plan.quotas?.dailyDownloads || 1} dl/day
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                      {plan.features?.map((feat, idx) => (
                        <div key={idx} className="flex items-start">
                          {feat.included ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-300 shrink-0 mr-2" />
                          )}
                          <span className={feat.included ? 'text-slate-700' : 'text-slate-400 line-through'}>
                            {feat.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <Link
                      to="/plans"
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center block transition-all ${
                        isGold
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md'
                          : isRecommended
                          ? 'bg-[#6C4CF1] hover:bg-[#5835ea] text-white shadow-md'
                          : 'bg-[#172033] hover:bg-[#0b111e] text-white'
                      }`}
                    >
                      {price === 0 ? 'Start Free' : `Select ${plan.name} Plan`}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/plans"
              className="inline-flex items-center text-sm font-semibold text-[#6C4CF1] hover:text-[#5835ea]"
            >
              Open Full Plan Matrix & Interactive Checkout
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. POWERFUL PLATFORM FEATURES SECTION */}
      <section id="features" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6C4CF1] mb-2">Engineered For Scale</h2>
            <h3 className="text-3xl font-bold text-[#172033]">Powerful Platform Capabilities</h3>
            <p className="text-slate-600 text-sm mt-2">
              Every feature is built with commercial SaaS rigor, verified entitlements, and clean architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-[#6C4CF1] flex items-center justify-center mb-5">
                <Tv className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#172033] mb-2">Tier-Gated Streaming</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                480p on Free, 720p on Bronze, 1080p Full HD on Silver, and crystal 4K Ultra HD on Gold. Verified by server-side headers.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-[#4F46E5] flex items-center justify-center mb-5">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#172033] mb-2">Daily Quota Enforcement</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated 7-step server validation checks daily download allowances (1, 3, 5, 10/day) and prevents unauthorized asset scraping.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#172033] mb-2">Razorpay Cryptographic Checkout</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Test mode sandbox with HMAC-SHA256 signature verification, webhook handling, and automatic payment receipt emails.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#172033] mb-2">Automated GST Invoices</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sequential tax invoice numbering with full customer details, GST rate breakdown, and one-click printable PDF view.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#172033] mb-2">Intelligent Lifecycle Rules</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Downgrades preserve existing paid benefits till period end. Expiry smoothly transitions accounts back to Free tier safely.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#172033] mb-2">Admin Control Center</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comprehensive panel for administrators to edit plan pricing, toggle availability, manage users, refund transactions, and inspect audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECURE PAYMENT MANAGEMENT SECTION */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-semibold text-emerald-800 mb-4">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Trust Payment Security</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-[#172033] leading-tight">
                Cryptographic Payment Processing via Razorpay
              </h3>
              <p className="text-slate-600 text-sm mt-4 leading-relaxed">
                SubSync never activates memberships based on unverified frontend signals. Every order is validated with secret credentials, checked for duplicate attempts, and authenticated with HMAC-SHA256 signature verification.
              </p>

              <div className="mt-6 space-y-3.5 text-sm">
                <div className="flex items-center space-x-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Test sandbox simulation ready for Cards, UPI, Netbanking & Wallets</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Webhook listener with signature verification and idempotent processing</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Automatic transaction rollback and refund logging</span>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-8 rounded-3xl border border-slate-200 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-[#6C4CF1]" />
                  <span className="font-bold text-sm text-[#172033]">Payment Verification Workflow</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">Passed</span>
              </div>

              <div className="mt-5 space-y-4 text-xs font-mono">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <p className="text-slate-400 text-[10px]">1. Order Creation</p>
                  <p className="text-slate-800 font-semibold mt-0.5">POST /api/payments/create-order → ₹299.00 INR</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <p className="text-slate-400 text-[10px]">2. Razorpay Signature Verification</p>
                  <p className="text-slate-800 font-semibold mt-0.5">HMAC_SHA256(order_id + payment_id, secret) == signature</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <p className="text-slate-400 text-[10px]">3. Subscription Entitlement Activation</p>
                  <p className="text-emerald-700 font-semibold mt-0.5">User tier updated to Gold (Tier 3) • Invoice generated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DYNAMIC TESTIMONIALS SECTION (3-CARD ROTATION) */}
      <section className="py-20 bg-[#F8FAFC] border-t border-slate-200 relative overflow-hidden">
        {/* Soft subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-violet-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
                Demo Content — Verified Sample Subscribers
              </span>
              <h3 className="text-3xl font-bold text-[#172033] mt-3">What Our Members Experience</h3>
              <p className="text-slate-600 text-sm mt-2">
                Feedback rotating dynamically from subscribers across all four SubSync membership tiers.
              </p>
            </div>

            {/* Interactive Shuffle Control */}
            <button
              onClick={handleShuffleTestimonials}
              className="touch-target self-start sm:self-auto inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-[#6C4CF1] bg-white hover:bg-violet-50/80 border border-slate-200/90 shadow-sm hover:shadow-violet-glow transition-all pressable"
              title="Shuffle and view 3 different testimonials"
              aria-label="Shuffle testimonials"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#6C4CF1] ${isTestimonialTransitioning ? 'animate-spin' : ''}`} />
              <span>Shuffle Reviews</span>
            </button>
          </div>

          {/* Dynamic 3-Card Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 min-h-[260px]">
            {displayedTestimonials.map((t) => (
              <div
                key={t.id}
                className={`liquid-glass p-6 sm:p-7 rounded-3xl border border-white/80 shadow-glass flex flex-col justify-between hover:shadow-violet-glow transition-all duration-300 ${
                  isTestimonialTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-4">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed italic">"{t.comment}"</p>
                </div>
                <div className="flex items-center space-x-3.5 mt-6 pt-5 border-t border-slate-100/90">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                    className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-violet-200/50"
                  />
                  <div className="hidden w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white font-bold text-xs items-center justify-center shadow-sm">
                    {t.initials}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[#172033]">{t.name}</h5>
                    <p className="text-xs text-slate-500">{t.role}</p>
                    <span className="text-[10px] text-[#6C4CF1] font-semibold">{t.tier}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6C4CF1] mb-2">Got Questions?</h2>
            <h3 className="text-3xl font-bold text-[#172033]">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="w-full flex justify-between items-center p-5 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-sm text-[#172033]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      openFaq === index ? 'rotate-180 text-[#6C4CF1]' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="p-5 text-sm text-slate-600 bg-white border-t border-slate-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. ABOUT SECTION */}
      <section id="about" className="py-16 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6C4CF1]">About SubSync</span>
          <h3 className="text-2xl font-bold text-[#172033]">"Your Subscription, Perfectly in Sync."</h3>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            SubSync is an enterprise-grade full-stack subscription and membership platform engineered with MongoDB, Express.js, React 19, and Node.js. It unifies recurring billing, cryptographic payment verification, centralized entitlement access control, and actionable subscription intelligence in one intuitive interface.
          </p>
        </div>
      </section>

      {/* 10. FINAL CALL TO ACTION */}
      <section className="py-16 bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to experience subscriptions perfectly in sync?
          </h2>
          <p className="text-violet-100 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Create your account today and unlock your automatic Free membership, or step up to Bronze, Silver, or Gold for unlimited scale.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold bg-white text-[#6C4CF1] hover:bg-slate-50 shadow-md transition-all"
            >
              Get Started Free
            </Link>
            <Link
              to="/plans"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold bg-violet-700/80 hover:bg-violet-800 text-white border border-violet-400/30 transition-all"
            >
              Explore All Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
