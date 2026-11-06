import BudgetPlan from '../models/BudgetPlan.js';
import TrackedSubscription from '../models/TrackedSubscription.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import PDFDocument from 'pdfkit';

/**
 * Normalizes any billing cycle into an accurate monthly equivalent cost in INR
 */
export const toMonthlyEquivalent = (amount, billingCycle) => {
  const num = Number(amount) || 0;
  switch (billingCycle) {
    case 'yearly':
      return Math.round((num / 12) * 100) / 100;
    case 'quarterly':
      return Math.round((num / 3) * 100) / 100;
    case 'weekly':
      return Math.round(num * 4.33 * 100) / 100;
    case 'one-time':
      return 0; // One-time purchases are not recurring monthly liabilities
    case 'monthly':
    default:
      return num;
  }
};

/**
 * Aggregates complete budget, expense metrics, category breakdown, and alerts
 */
export const calculateUserBudgetAnalytics = async (userId) => {
  let budgetPlan = await BudgetPlan.findOne({ user: userId });
  if (!budgetPlan) {
    budgetPlan = await BudgetPlan.create({
      user: userId,
      monthlyBudget: 3000,
      yearlyBudget: 36000,
      currency: 'INR',
      warningThresholdPercent: 80,
      categoryBudgets: [],
      alerts: [],
    });
  }

  // 1. Fetch active native SubSync subscription
  const nativeSub = await Subscription.findOne({ user: userId, status: 'Active' }).populate('plan');

  // 2. Fetch active external tracked subscriptions
  const trackedSubs = await TrackedSubscription.find({
    user: userId,
    status: { $ne: 'Cancelled' },
  }).sort({ nextRenewalDate: 1 });

  // 3. Compile list of active recurring subscriptions
  const allActiveSubscriptions = [];

  // Add native SubSync plan if paid
  if (nativeSub && nativeSub.plan && nativeSub.plan.monthlyPrice > 0) {
    allActiveSubscriptions.push({
      id: `subsync_${nativeSub._id}`,
      name: `SubSync ${nativeSub.plan.name} Tier`,
      provider: 'SubSync Inc.',
      category: 'Productivity',
      amount: nativeSub.plan.monthlyPrice,
      currency: nativeSub.plan.currency || 'INR',
      billingCycle: nativeSub.billingCycle || 'monthly',
      monthlyCost: toMonthlyEquivalent(nativeSub.plan.monthlyPrice, nativeSub.billingCycle || 'monthly'),
      nextRenewalDate: nativeSub.currentPeriodEnd,
      isNative: true,
    });
  }

  // Add tracked subscriptions
  for (const ts of trackedSubs) {
    allActiveSubscriptions.push({
      id: ts._id.toString(),
      name: ts.name,
      provider: ts.provider || ts.name,
      category: ts.category || 'Other',
      amount: ts.amount,
      currency: ts.currency || 'INR',
      billingCycle: ts.billingCycle || 'monthly',
      monthlyCost: toMonthlyEquivalent(ts.amount, ts.billingCycle || 'monthly'),
      nextRenewalDate: ts.nextRenewalDate,
      isNative: false,
    });
  }

  // 4. Calculate total monthly & yearly expenditure
  const totalMonthlyExpense = allActiveSubscriptions.reduce((acc, sub) => acc + sub.monthlyCost, 0);
  const totalYearlyExpense = totalMonthlyExpense * 12;

  // 5. Utilization metrics
  const utilizationPercent = budgetPlan.monthlyBudget > 0
    ? Math.round((totalMonthlyExpense / budgetPlan.monthlyBudget) * 100)
    : 0;
  const remainingMonthlyBudget = Math.max(0, budgetPlan.monthlyBudget - totalMonthlyExpense);

  // 6. Category breakdown
  const categoryMap = {};
  for (const sub of allActiveSubscriptions) {
    const cat = sub.category || 'Other';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, totalMonthly: 0, count: 0, subscriptions: [] };
    }
    categoryMap[cat].totalMonthly += sub.monthlyCost;
    categoryMap[cat].count += 1;
    categoryMap[cat].subscriptions.push(sub.name);
  }

  const categoryBreakdown = Object.values(categoryMap).map((c) => ({
    ...c,
    totalMonthly: Math.round(c.totalMonthly),
    percentOfSpend: totalMonthlyExpense > 0 ? Math.round((c.totalMonthly / totalMonthlyExpense) * 100) : 0,
  }));

  // 7. Upcoming renewals in next 30 days
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const upcomingRenewals = allActiveSubscriptions
    .filter((s) => s.nextRenewalDate && new Date(s.nextRenewalDate) >= now && new Date(s.nextRenewalDate) <= thirtyDaysLater)
    .sort((a, b) => new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate));

  // 8. Historical payment trends (last 6 months from actual Payment ledger)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const historicalPayments = await Payment.find({
    user: userId,
    status: 'Successful',
    createdAt: { $gte: sixMonthsAgo },
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrend = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();

    const monthPayments = historicalPayments.filter((p) => {
      const pDate = new Date(p.createdAt);
      return pDate.getMonth() === m && pDate.getFullYear() === y;
    });

    const totalPaid = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    // Baseline includes current recurring monthly subscriptions for projected current month
    const displayAmount = i === 0 ? Math.max(totalPaid, Math.round(totalMonthlyExpense)) : totalPaid;

    monthlyTrend.push({
      month: `${monthNames[m]} ${y}`,
      spent: displayAmount,
      budget: budgetPlan.monthlyBudget,
    });
  }

  // 9. Generate Smart Real-Time Alerts
  const dynamicAlerts = [];

  if (utilizationPercent >= 100) {
    dynamicAlerts.push({
      type: 'projected_overbudget',
      severity: 'critical',
      message: `You have exceeded your monthly budget by ₹${Math.round(totalMonthlyExpense - budgetPlan.monthlyBudget)} (${utilizationPercent}% utilization).`,
      createdAt: new Date(),
    });
  } else if (utilizationPercent >= budgetPlan.warningThresholdPercent) {
    dynamicAlerts.push({
      type: 'threshold_exceeded',
      severity: 'warning',
      message: `You have reached ${utilizationPercent}% of your ₹${budgetPlan.monthlyBudget} monthly budget limit.`,
      createdAt: new Date(),
    });
  }

  const renewalsInNext7Days = upcomingRenewals.filter((r) => {
    const diff = (new Date(r.nextRenewalDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  if (renewalsInNext7Days.length >= 2) {
    dynamicAlerts.push({
      type: 'multiple_renewals',
      severity: 'info',
      message: `${renewalsInNext7Days.length} subscriptions are renewing within the next 7 days. Ensure payment methods have sufficient balance.`,
      createdAt: new Date(),
    });
  }

  return {
    budgetPlan: {
      monthlyBudget: budgetPlan.monthlyBudget,
      yearlyBudget: budgetPlan.yearlyBudget,
      currency: budgetPlan.currency,
      warningThresholdPercent: budgetPlan.warningThresholdPercent,
      categoryBudgets: budgetPlan.categoryBudgets,
    },
    metrics: {
      totalMonthlyExpense: Math.round(totalMonthlyExpense),
      totalYearlyExpense: Math.round(totalYearlyExpense),
      budgetUtilizationPercent: utilizationPercent,
      remainingMonthlyBudget: Math.round(remainingMonthlyBudget),
      activeSubscriptionsCount: allActiveSubscriptions.length,
      averagePerSubscription:
        allActiveSubscriptions.length > 0 ? Math.round(totalMonthlyExpense / allActiveSubscriptions.length) : 0,
    },
    allActiveSubscriptions,
    categoryBreakdown,
    upcomingRenewals,
    monthlyTrend,
    alerts: dynamicAlerts,
  };
};

/**
 * Runs What-If simulation without modifying database records
 */
export const runWhatIfSimulation = (baselineData, scenario) => {
  const { removedSubIds = [], cycleSwitches = [], newSubscriptions = [] } = scenario;

  let simulatedSubs = baselineData.allActiveSubscriptions.map((sub) => ({ ...sub }));

  // 1. Remove subscriptions
  if (removedSubIds.length > 0) {
    simulatedSubs = simulatedSubs.filter((s) => !removedSubIds.includes(s.id));
  }

  // 2. Switch billing cycles (e.g. switching monthly to annual saves ~15%)
  for (const cs of cycleSwitches) {
    const target = simulatedSubs.find((s) => s.id === cs.subId);
    if (target) {
      if (cs.newCycle === 'yearly' && target.billingCycle === 'monthly') {
        // Annual discount factor: 10 months price for 12 months
        target.monthlyCost = Math.round((target.amount * 10) / 12);
        target.billingCycle = 'yearly';
      } else if (cs.newCycle === 'monthly' && target.billingCycle === 'yearly') {
        target.monthlyCost = Math.round(target.amount / 10); // reverse discount
        target.billingCycle = 'monthly';
      }
    }
  }

  // 3. Add simulated new subscriptions
  for (const ns of newSubscriptions) {
    const cost = toMonthlyEquivalent(ns.amount, ns.cycle || 'monthly');
    simulatedSubs.push({
      id: `sim_${Math.random()}`,
      name: ns.name,
      amount: ns.amount,
      billingCycle: ns.cycle || 'monthly',
      monthlyCost: cost,
      category: ns.category || 'Other',
      isSimulated: true,
    });
  }

  const baselineMonthly = baselineData.metrics.totalMonthlyExpense;
  const simulatedMonthly = Math.round(simulatedSubs.reduce((acc, s) => acc + s.monthlyCost, 0));

  const monthlyDelta = simulatedMonthly - baselineMonthly; // negative = savings, positive = additional cost
  const yearlyDelta = monthlyDelta * 12;
  const percentChange = baselineMonthly > 0 ? Math.round((monthlyDelta / baselineMonthly) * 100) : 0;

  return {
    baselineMonthly,
    simulatedMonthly,
    monthlyDelta,
    yearlyDelta,
    percentChange,
    savingsAmount: monthlyDelta < 0 ? Math.abs(monthlyDelta) : 0,
    additionalExpense: monthlyDelta > 0 ? monthlyDelta : 0,
    newUtilizationPercent:
      baselineData.budgetPlan.monthlyBudget > 0
        ? Math.round((simulatedMonthly / baselineData.budgetPlan.monthlyBudget) * 100)
        : 0,
  };
};

/**
 * Generates CSV string of user budget and subscription ledger
 */
export const generateBudgetCsv = (budgetData) => {
  let csv = 'SUBSYNC SUBSCRIPTION BUDGET REPORT\n';
  csv += `Generated On,${new Date().toISOString()}\n`;
  csv += `Monthly Budget,₹${budgetData.budgetPlan.monthlyBudget}\n`;
  csv += `Total Monthly Spend,₹${budgetData.metrics.totalMonthlyExpense}\n`;
  csv += `Budget Utilization,${budgetData.metrics.budgetUtilizationPercent}%\n`;
  csv += `Total Yearly Spend,₹${budgetData.metrics.totalYearlyExpense}\n\n`;

  csv += 'ACTIVE SUBSCRIPTIONS BREAKDOWN\n';
  csv += 'Subscription Name,Provider,Category,Amount,Billing Cycle,Monthly Cost (INR),Next Renewal\n';

  for (const s of budgetData.allActiveSubscriptions) {
    const renewalStr = s.nextRenewalDate ? new Date(s.nextRenewalDate).toLocaleDateString() : 'N/A';
    csv += `"${s.name}","${s.provider}","${s.category}",${s.amount},${s.billingCycle},${s.monthlyCost},${renewalStr}\n`;
  }

  csv += '\nCATEGORY WISE EXPENDITURE\n';
  csv += 'Category,Total Monthly (INR),Share of Total (%)\n';
  for (const c of budgetData.categoryBreakdown) {
    csv += `"${c.category}",${c.totalMonthly},${c.percentOfSpend}%\n`;
  }

  return csv;
};

/**
 * Generates clean PDF budget report via PDFKit
 */
export const generateBudgetPdf = (budgetData, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  // Border & Header
  doc.rect(20, 20, 555, 802).lineWidth(1.5).stroke('#7C3AED');

  doc.fontSize(22).fillColor('#6D28D9').text('SUBSYNC BUDGET & EXPENSE REPORT', 50, 45, { align: 'center' });
  doc.fontSize(10).fillColor('#64748B').text(`Generated: ${new Date().toLocaleDateString()} | SubSync Financial Intelligence`, { align: 'center' });

  doc.moveDown(1.5);

  // Summary Metrics Box
  doc.rect(50, doc.y, 495, 80).fill('#F5F3FF');
  const boxY = doc.y + 15;

  doc.fillColor('#4C1D95').fontSize(11).font('Helvetica-Bold');
  doc.text(`Monthly Budget: ₹${budgetData.budgetPlan.monthlyBudget}`, 65, boxY);
  doc.text(`Actual Monthly Spend: ₹${budgetData.metrics.totalMonthlyExpense}`, 230, boxY);
  doc.text(`Budget Utilization: ${budgetData.metrics.budgetUtilizationPercent}%`, 410, boxY);

  doc.text(`Yearly Projected: ₹${budgetData.metrics.totalYearlyExpense}`, 65, boxY + 30);
  doc.text(`Remaining Budget: ₹${budgetData.metrics.remainingMonthlyBudget}`, 230, boxY + 30);
  doc.text(`Active Subs: ${budgetData.metrics.activeSubscriptionsCount}`, 410, boxY + 30);

  doc.font('Helvetica');
  doc.y = boxY + 65;
  doc.moveDown(1.5);

  // Subscriptions Table Header
  doc.fontSize(14).fillColor('#1E293B').font('Helvetica-Bold').text('Active Subscriptions Breakdown');
  doc.moveDown(0.5);

  const startY = doc.y;
  doc.fontSize(9).fillColor('#64748B').font('Helvetica-Bold');
  doc.text('Service Name', 50, startY);
  doc.text('Category', 220, startY);
  doc.text('Cycle', 330, startY);
  doc.text('Amount', 410, startY);
  doc.text('Monthly Eq.', 480, startY);

  doc.moveTo(50, startY + 14).lineTo(545, startY + 14).lineWidth(0.5).stroke('#E2E8F0');

  let curY = startY + 20;
  doc.font('Helvetica').fontSize(9).fillColor('#334155');

  for (const s of budgetData.allActiveSubscriptions) {
    if (curY > 720) {
      doc.addPage();
      curY = 50;
    }
    doc.text(s.name.slice(0, 24), 50, curY);
    doc.text(s.category, 220, curY);
    doc.text(s.billingCycle, 330, curY);
    doc.text(`₹${s.amount}`, 410, curY);
    doc.text(`₹${s.monthlyCost}`, 480, curY);
    curY += 18;
  }

  // Category Breakdown Section
  curY += 15;
  if (curY > 700) {
    doc.addPage();
    curY = 50;
  }

  doc.fontSize(14).fillColor('#1E293B').font('Helvetica-Bold').text('Category-Wise Spend', 50, curY);
  curY += 20;

  for (const c of budgetData.categoryBreakdown) {
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text(`• ${c.category}: ₹${c.totalMonthly}/mo (${c.percentOfSpend}% of budget)`, 60, curY);
    curY += 16;
  }

  doc.end();
};

