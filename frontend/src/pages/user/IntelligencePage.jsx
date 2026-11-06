import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  PieChart as PieIcon,
  HelpCircle,
  Zap,
  Sliders,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const IntelligencePage = () => {
  const [activeTab, setActiveTab] = useState('advisor'); // 'advisor', 'waste', 'simulator'
  const [adviceData, setAdviceData] = useState(null);
  const [wasteData, setWasteData] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulator state
  const [simTargetPlan, setSimTargetPlan] = useState('silver');
  const [simDuration, setSimDuration] = useState(6);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  const fetchIntelligenceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [adviceRes, wasteRes] = await Promise.all([
        api.get('/intelligence/advisor'),
        api.get('/intelligence/waste-detector'),
      ]);

      if (adviceRes.data?.success) setAdviceData(adviceRes.data.advice);
      if (wasteRes.data?.success) setWasteData(wasteRes.data.wasteAnalysis);

      // Run initial simulation
      await runSimulation('silver', 6);
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
      setError('Unable to load subscription intelligence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (planSlug, duration) => {
    try {
      setSimLoading(true);
      const res = await api.post('/intelligence/simulate-cost', {
        targetPlanSlug: planSlug,
        durationMonths: duration,
      });
      if (res.data?.success) {
        setSimulationData(res.data.simulation);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const handleSimulateChange = (newPlan, newDuration) => {
    setSimTargetPlan(newPlan);
    setSimDuration(newDuration);
    runSimulation(newPlan, newDuration);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center text-[#6C4CF1] animate-spin mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-[#172033]">Analyzing Subscription Telemetry...</h3>
        <p className="text-xs text-slate-500 mt-1">Inspecting download frequencies, quota utilization, and expenditure metrics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 text-[#172033]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HERO HEADER */}
        <div className="mb-8 p-6 sm:p-8 liquid-glass rounded-3xl border border-white/80 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#6C4CF1]/10 via-[#A855F7]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white flex items-center justify-center shadow-md shrink-0">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C4CF1] bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200">
                  SubSync Core Intelligence
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Algorithmic Engine Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] mt-1 tracking-tight">
                SubSync Intelligence
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                AI Subscription Advisor, Waste Detector, and Multi-Month Financial Cost Simulator
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center space-x-2">
            <button
              onClick={fetchIntelligenceData}
              className="touch-target px-4 py-2.5 bg-white/80 hover:bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh Metrics</span>
            </button>
            <Link
              to="/plans"
              className="touch-target px-4 py-2.5 liquid-button text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Plans</span>
            </Link>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center space-x-2 mb-8 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'advisor', label: 'AI Subscription Advisor', icon: Brain },
            { id: 'waste', label: 'Subscription Waste Detector', icon: AlertTriangle },
            { id: 'simulator', label: 'Subscription Cost Simulator', icon: DollarSign },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`touch-target px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 pressable ${
                  active
                    ? 'bg-[#6C4CF1] text-white shadow-md'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80 shadow-sm'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* MODULE A: AI SUBSCRIPTION ADVISOR                        */}
        {/* ======================================================== */}
        {activeTab === 'advisor' && adviceData && (
          <div className="space-y-6 animate-in fade-in">
            {/* Recommendation Highlight Card */}
            <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C4CF1]">
                      Engine Analysis Result
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        adviceData.isCurrentOptimal
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : adviceData.actionType === 'upgrade'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {adviceData.isCurrentOptimal
                        ? 'Current Plan Optimal'
                        : adviceData.actionType === 'upgrade'
                        ? 'Upgrade Recommended'
                        : 'Cost-Saving Downgrade Available'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#172033] mt-1.5">
                    {adviceData.headline}
                  </h2>
                </div>

                <div className="flex items-center space-x-3 self-start md:self-auto">
                  {!adviceData.isCurrentOptimal && (
                    <Link
                      to="/plans"
                      className="touch-target px-5 py-2.5 liquid-button text-xs font-bold rounded-xl shadow-md flex items-center space-x-2"
                    >
                      <span>Switch to {adviceData.recommendedPlan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Comparison Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="p-5 rounded-2xl bg-white/90 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Current Plan</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Tier {adviceData.currentPlan.slug === 'free' ? 0 : 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#172033]">{adviceData.currentPlan.name} Plan</h3>
                  <p className="text-2xl font-black text-[#6C4CF1]">
                    ₹{adviceData.currentPlan.monthlyPrice} <span className="text-xs text-slate-500 font-normal">/ month</span>
                  </p>
                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                    <p>• Daily limit: {adviceData.currentPlan.dailyLimit} download(s)</p>
                    <p>• Monthly quota: {adviceData.currentPlan.monthlyLimit} downloads</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50/90 to-indigo-50/90 border border-violet-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#6C4CF1]">Recommended Plan</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-[#6C4CF1]">
                      Best Fit
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#172033]">{adviceData.recommendedPlan.name} Plan</h3>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-black text-[#6C4CF1]">
                      ₹{adviceData.recommendedPlan.monthlyPrice} <span className="text-xs text-slate-500 font-normal">/ month</span>
                    </p>
                    {adviceData.costDifference !== 0 && (
                      <span className={`text-xs font-bold ${adviceData.costDifference > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        ({adviceData.costDifference > 0 ? `+₹${adviceData.costDifference}` : `-₹${Math.abs(adviceData.costDifference)}`}/mo)
                      </span>
                    )}
                  </div>
                  <div className="text-xs space-y-1.5 pt-2 border-t border-violet-100 text-slate-700">
                    <p>• Daily limit: {adviceData.recommendedPlan.dailyLimit} download(s)</p>
                    <p>• Monthly quota: {adviceData.recommendedPlan.monthlyLimit} downloads</p>
                  </div>
                </div>
              </div>

              {/* Rationale Checklist */}
              <div className="mt-6 pt-6 border-t border-slate-200/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Why This Plan Was Selected
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {adviceData.rationale.map((point, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/80 border border-slate-200 text-xs flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#6C4CF1] shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics Audit Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bento-card p-5">
                <span className="text-[10px] font-bold uppercase text-slate-400">30-Day Downloads</span>
                <p className="text-2xl font-black text-[#172033] mt-1">{adviceData.metrics.recentDownloadsCount}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Resources accessed</p>
              </div>

              <div className="bento-card p-5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Active Days</span>
                <p className="text-2xl font-black text-[#172033] mt-1">{adviceData.metrics.activeDaysPastMonth}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">In past 30 days</p>
              </div>

              <div className="bento-card p-5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Monthly Quota Used</span>
                <p className="text-2xl font-black text-[#6C4CF1] mt-1">{adviceData.metrics.monthlyUtilizationPct}%</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Of current allowance</p>
              </div>

              <div className="bento-card p-5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Peak Single Day</span>
                <p className="text-2xl font-black text-[#172033] mt-1">{adviceData.metrics.maxDownloadsInSingleDay}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Downloads in 24 hours</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODULE B: SUBSCRIPTION WASTE DETECTOR                    */}
        {/* ======================================================== */}
        {activeTab === 'waste' && wasteData && (
          <div className="space-y-6 animate-in fade-in">
            {/* Overview Bento Card */}
            <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C4CF1]">
                    Efficiency & Waste Diagnostic
                  </span>
                  <h2 className="text-2xl font-black text-[#172033] mt-1">
                    Subscription Efficiency: {wasteData.usagePercent}%
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">{wasteData.recommendationMessage}</p>
                </div>

                <div className="text-right self-start md:self-auto">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Annual Inefficiency</span>
                  <span className="text-2xl font-black text-rose-600">
                    ₹{wasteData.estimatedMonetaryWasteYearly.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Unused Downloads</span>
                  <p className="text-3xl font-black text-amber-600">
                    {wasteData.unusedDownloads} <span className="text-xs text-slate-400 font-normal">/ {wasteData.monthlyQuota}</span>
                  </p>
                  <p className="text-xs text-slate-500">Unclaimed monthly quota</p>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${wasteData.wastePercent}%` }}></div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Days Since Last Download</span>
                  <p className="text-3xl font-black text-[#172033]">
                    {wasteData.daysSinceLastActivity} <span className="text-xs text-slate-400 font-normal">days ago</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {wasteData.isInactiveWarning ? '⚠️ Subscription has been idle for 14+ days' : 'Active engagement verified'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Monthly Burn Rate</span>
                  <p className="text-3xl font-black text-[#6C4CF1]">₹{wasteData.monthlyPrice}</p>
                  <p className="text-xs text-slate-500">Lifetime total: ₹{wasteData.lifetimeSpent.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODULE C: SUBSCRIPTION COST SIMULATOR                    */}
        {/* ======================================================== */}
        {activeTab === 'simulator' && simulationData && (
          <div className="space-y-6 animate-in fade-in">
            {/* Interactive Selector Card */}
            <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C4CF1]">
                    Interactive Financial Forecaster
                  </span>
                  <h2 className="text-2xl font-black text-[#172033] mt-1">Multi-Month Cost Simulation</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Calculate projected commitment, bundle discounts, and cost variations across commitment terms.
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                {/* Target Plan Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Select Target Plan
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { slug: 'bronze', name: 'Bronze', price: '₹99' },
                      { slug: 'silver', name: 'Silver', price: '₹199' },
                      { slug: 'gold', name: 'Gold', price: '₹299' },
                    ].map((plan) => (
                      <button
                        key={plan.slug}
                        onClick={() => handleSimulateChange(plan.slug, simDuration)}
                        className={`touch-target p-3 rounded-2xl border text-center transition-all ${
                          simTargetPlan === plan.slug
                            ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow-md'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <p className="font-bold text-xs">{plan.name}</p>
                        <p className={`text-[11px] mt-0.5 ${simTargetPlan === plan.slug ? 'text-violet-200' : 'text-slate-400'}`}>
                          {plan.price}/mo
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Commitment Horizon
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { months: 3, label: '3 Months', incentive: '5% Off' },
                      { months: 6, label: '6 Months', incentive: '10% Off' },
                      { months: 12, label: '12 Months', incentive: '15% Off' },
                    ].map((dur) => (
                      <button
                        key={dur.months}
                        onClick={() => handleSimulateChange(simTargetPlan, dur.months)}
                        className={`touch-target p-3 rounded-2xl border text-center transition-all ${
                          simDuration === dur.months
                            ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow-md'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <p className="font-bold text-xs">{dur.label}</p>
                        <span className={`text-[10px] font-semibold block mt-0.5 ${simDuration === dur.months ? 'text-violet-200' : 'text-emerald-600'}`}>
                          {dur.incentive}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Simulation Result Presentation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Projected Cost</span>
                  <p className="text-3xl font-black text-[#172033] mt-2">
                    ₹{simulationData.simulation.totalEstimatedCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">For {simulationData.simulation.durationMonths} months</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Monthly Equivalent</span>
                  <p className="text-3xl font-black text-[#6C4CF1] mt-2">
                    ₹{simulationData.simulation.monthlyEquivalentCost}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Average per calendar month</p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-sm text-center">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Multi-Month Savings</span>
                  <p className="text-3xl font-black text-emerald-700 mt-2">
                    ₹{simulationData.simulation.savingsVsStandardMonthly.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Vs paying standard month-to-month</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligencePage;

