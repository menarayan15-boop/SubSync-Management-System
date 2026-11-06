import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Download,
  Sliders,
  Calendar,
  PieChart,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

const SubscriptionBudgetPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Settings form
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState('3000');
  const [thresholdInput, setThresholdInput] = useState('80');

  // What-If Simulation State
  const [selectedRemoveIds, setSelectedRemoveIds] = useState([]);
  const [simNewName, setSimNewName] = useState('');
  const [simNewAmount, setSimNewAmount] = useState('');
  const [simNewCycle, setSimNewCycle] = useState('monthly');
  const [simulatedNewSubs, setSimulatedNewSubs] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/budget');
      if (res.data?.success) {
        setData(res.data.data);
        setMonthlyBudgetInput(res.data.data.budgetPlan.monthlyBudget.toString());
        setThresholdInput(res.data.data.budgetPlan.warningThresholdPercent.toString());
      }
    } catch (err) {
      console.error('Failed to load budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await api.put('/api/budget/settings', {
        monthlyBudget: Number(monthlyBudgetInput),
        warningThresholdPercent: Number(thresholdInput),
      });
      if (res.data?.success) {
        setData(res.data.data);
        setShowSettingsModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update budget settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRunSimulation = async () => {
    try {
      setSimulating(true);
      const res = await api.post('/api/budget/simulate', {
        removedSubIds: selectedRemoveIds,
        newSubscriptions: simulatedNewSubs,
      });
      if (res.data?.success) {
        setSimulationResult(res.data.simulation);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleAddSimulatedSub = (e) => {
    e.preventDefault();
    if (!simNewName.trim() || !simNewAmount || isNaN(Number(simNewAmount))) return;

    const newSub = {
      name: simNewName.trim(),
      amount: Number(simNewAmount),
      cycle: simNewCycle,
    };

    const updated = [...simulatedNewSubs, newSub];
    setSimulatedNewSubs(updated);
    setSimNewName('');
    setSimNewAmount('');
  };

  const removeSimulatedSub = (index) => {
    const updated = simulatedNewSubs.filter((_, idx) => idx !== index);
    setSimulatedNewSubs(updated);
  };

  const toggleRemoveSubscription = (subId) => {
    if (selectedRemoveIds.includes(subId)) {
      setSelectedRemoveIds(selectedRemoveIds.filter((id) => id !== subId));
    } else {
      setSelectedRemoveIds([...selectedRemoveIds, subId]);
    }
  };

  useEffect(() => {
    if (data) {
      handleRunSimulation();
    }
  }, [selectedRemoveIds, simulatedNewSubs]);

  const getUtilizationBarColor = (pct) => {
    if (pct >= 100) return 'bg-rose-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-violet-600';
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-2">
              <Wallet className="w-3.5 h-3.5" />
              <span>Financial Health & Expense Control</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Subscription Budget Planner
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Track actual monthly commitments, forecast upcoming renewals, analyze category distributions, and simulate spending changes without altering your live data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Sliders className="w-4 h-4 text-violet-600" />
              <span>Budget Settings</span>
            </button>

            <a
              href="/api/budget/export/csv"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV</span>
            </a>

            <a
              href="/api/budget/export/pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </a>
          </div>
        </div>

        {/* Smart Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <div className="space-y-3">
            {data.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  alert.severity === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-violet-50 border-violet-200 text-violet-800'
                }`}
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-semibold">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Monthly Spend</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                ₹{loading ? '...' : data?.metrics?.totalMonthlyExpense || 0}
              </span>
              <span className="text-xs text-slate-500">/ month</span>
            </div>
            <p className="text-xs text-slate-400">
              Target budget: ₹{data?.budgetPlan?.monthlyBudget || 3000}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Budget Remaining</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">
                ₹{loading ? '...' : data?.metrics?.remainingMonthlyBudget || 0}
              </span>
              <span className="text-xs text-slate-500">unallocated</span>
            </div>
            <p className="text-xs text-slate-400">
              Safety cushion before exceeding limit
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Budget Utilization</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {loading ? '...' : data?.metrics?.budgetUtilizationPercent || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getUtilizationBarColor(
                  data?.metrics?.budgetUtilizationPercent || 0
                )}`}
                style={{ width: `${Math.min(100, data?.metrics?.budgetUtilizationPercent || 0)}%` }}
              ></div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Yearly Commitment</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                ₹{loading ? '...' : data?.metrics?.totalYearlyExpense || 0}
              </span>
              <span className="text-xs text-slate-500">/ year</span>
            </div>
            <p className="text-xs text-slate-400">
              Across {data?.metrics?.activeSubscriptionsCount || 0} active subscriptions
            </p>
          </div>
        </div>

        {/* Charts & Category Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Spending Trend (Left 7 Cols) */}
          <div className="lg:col-span-7 p-6 lg:p-8 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Spending Trend vs Budget</h3>
                <p className="text-xs text-slate-400">Monthly actual payments compared to configured budget threshold</p>
              </div>
              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
                Past 6 Months
              </span>
            </div>

            <div className="h-64 w-full pt-4">
              {data?.monthlyTrend && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip
                      formatter={(val) => [`₹${val}`, 'Monthly Spend']}
                      contentStyle={{ backgroundColor: '#1E1B4B', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="spent" radius={[6, 6, 0, 0]}>
                      {data.monthlyTrend.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.spent > entry.budget ? '#F43F5E' : '#7C3AED'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category Breakdown (Right 5 Cols) */}
          <div className="lg:col-span-5 p-6 lg:p-8 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Category Distribution</h3>
            <p className="text-xs text-slate-400">Where your monthly subscription budget goes</p>

            <div className="space-y-3 pt-2">
              {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                data.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.category}</span>
                      <span className="font-bold text-slate-900">₹{cat.totalMonthly} ({cat.percentOfSpend}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, cat.percentOfSpend)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No categorized subscriptions recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* What-If Scenario Simulator */}
        <div className="p-6 lg:p-8 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Simulation</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">What-If Budget Scenario Simulator</h3>
              <p className="text-xs text-slate-500">
                Test the financial impact of cancelling subscriptions, switching to annual billing, or adding new services without affecting your actual data.
              </p>
            </div>

            {simulationResult && (
              <div className="p-3 rounded-2xl bg-violet-50 border border-violet-100 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Projected Impact</span>
                <span
                  className={`text-lg font-extrabold ${
                    simulationResult.monthlyDelta < 0
                      ? 'text-emerald-600'
                      : simulationResult.monthlyDelta > 0
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  {simulationResult.monthlyDelta < 0
                    ? `Save ₹${Math.abs(simulationResult.monthlyDelta)} /mo`
                    : simulationResult.monthlyDelta > 0
                    ? `+₹${simulationResult.monthlyDelta} /mo`
                    : 'No Change'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Simulate Cancelling Existing Subs (Left 6 Cols) */}
            <div className="lg:col-span-6 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                1. Simulate Removing Active Subscriptions
              </h4>
              <p className="text-xs text-slate-400">Click to toggle removing a subscription from the simulation:</p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {data?.allActiveSubscriptions?.map((sub) => {
                  const isRemoved = selectedRemoveIds.includes(sub.id);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => toggleRemoveSubscription(sub.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isRemoved
                          ? 'bg-rose-50 border-rose-300 text-rose-800 line-through opacity-75'
                          : 'bg-slate-50/50 border-slate-200 text-slate-800 hover:border-violet-300'
                      }`}
                    >
                      <span className="text-xs font-semibold">{sub.name}</span>
                      <span className="text-xs font-bold">₹{sub.monthlyCost}/mo</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulate Adding New Subs (Right 6 Cols) */}
            <div className="lg:col-span-6 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                2. Simulate Adding a New Subscription
              </h4>

              <form onSubmit={handleAddSimulatedSub} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Service Name (e.g. Gym)"
                  value={simNewName}
                  onChange={(e) => setSimNewName(e.target.value)}
                  className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <input
                  type="number"
                  placeholder="₹ Amount"
                  value={simNewAmount}
                  onChange={(e) => setSimNewAmount(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <select
                  value={simNewCycle}
                  onChange={(e) => setSimNewCycle(e.target.value)}
                  className="px-2 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {simulatedNewSubs.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {simulatedNewSubs.map((ns, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-purple-900">{ns.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-900">₹{ns.amount} ({ns.cycle})</span>
                        <button
                          type="button"
                          onClick={() => removeSimulatedSub(idx)}
                          className="text-purple-400 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Configure Budget Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Target Monthly Budget (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={monthlyBudgetInput}
                    onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Yearly budget will auto-adjust to ₹{Number(monthlyBudgetInput || 0) * 12}.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Warning Threshold Percentage ({thresholdInput}%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    className="w-full accent-violet-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-200 cursor-pointer disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBudgetPage;

