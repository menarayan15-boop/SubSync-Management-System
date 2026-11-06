/**
 * SubSync Intelligence Engine
 * Algorithmic rule-based subscription advisor, waste detector, and financial cost simulator.
 * Built modularly to allow LLM/GenAI drop-in integration.
 */

export const generateSubscriptionAdvice = ({
  user,
  subscription,
  downloadHistory = [],
  payments = [],
  allPlans = [],
}) => {
  const activePlan = subscription?.plan || allPlans.find((p) => p.slug === 'free') || {
    name: 'Free',
    slug: 'free',
    tierLevel: 0,
    monthlyPrice: 0,
    quotas: { dailyDownloads: 1, monthlyDownloads: 30, streamingQuality: '480p' },
  };

  const dailyLimit = activePlan.quotas?.dailyDownloads || 1;
  const monthlyLimit = activePlan.quotas?.monthlyDownloads || 30;

  // 1. Analyze 30-day activity
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentDownloads = downloadHistory.filter((d) => new Date(d.downloadedAt) >= thirtyDaysAgo);
  const totalRecentDownloads = recentDownloads.length;

  // Distinct active days in past 30 days
  const activeDaysSet = new Set(
    recentDownloads.map((d) => new Date(d.downloadedAt).toISOString().split('T')[0])
  );
  const activeDaysCount = activeDaysSet.size;

  // Max downloads on any single day
  const dailyCountMap = {};
  recentDownloads.forEach((d) => {
    const day = new Date(d.downloadedAt).toISOString().split('T')[0];
    dailyCountMap[day] = (dailyCountMap[day] || 0) + 1;
  });
  const maxDownloadsInSingleDay = Object.values(dailyCountMap).reduce((m, c) => Math.max(m, c), 0);

  // Utilization percentage of monthly quota
  const monthlyUtilizationPct = Math.min(100, Math.round((totalRecentDownloads / monthlyLimit) * 100));

  // Determine recommendation
  let recommendedPlanSlug = activePlan.slug;
  let reason = '';
  let rationale = [];
  let urgency = 'normal'; // 'low', 'normal', 'high'
  let estimatedSavingsOrCost = 0;

  // New member or insufficient data
  if (totalRecentDownloads === 0 && downloadHistory.length <= 1) {
    recommendedPlanSlug = activePlan.slug;
    reason = `You have just joined SubSync! Your current ${activePlan.name} plan is a great foundation while you explore the Digital Resource Vault.`;
    rationale = [
      'Account has newly been provisioned',
      'No download bottlenecks detected yet',
      'Full catalog exploration is recommended before changing tiers',
    ];
  } else if (activePlan.slug === 'free') {
    // Free user evaluation
    if (totalRecentDownloads >= 15 || maxDownloadsInSingleDay >= 1) {
      recommendedPlanSlug = 'bronze';
      const bronzePlan = allPlans.find((p) => p.slug === 'bronze');
      estimatedSavingsOrCost = bronzePlan?.monthlyPrice || 99;
      reason = 'You frequently utilize resources and are encountering the 1 download/day ceiling. Upgrading to Bronze unlocks 3 downloads/day and 720p HD streaming.';
      urgency = 'high';
      rationale = [
        `You accessed ${totalRecentDownloads} resources in the last 30 days`,
        'Daily limit of 1 download was reached multiple times',
        'Bronze provides 3x higher capacity for just ₹99/month',
      ];
    } else {
      recommendedPlanSlug = 'free';
      reason = 'Your current usage is well within the Free tier benefits. No upgrade is currently needed.';
      rationale = [
        `Utilized ${totalRecentDownloads} downloads over 30 days`,
        'No capacity bottlenecks observed',
        'Saving ₹99–₹299/month by staying on the Free plan',
      ];
    }
  } else if (activePlan.slug === 'bronze') {
    // Bronze user evaluation
    if (totalRecentDownloads >= 40 || maxDownloadsInSingleDay >= 3) {
      recommendedPlanSlug = 'silver';
      const diff = (allPlans.find((p) => p.slug === 'silver')?.monthlyPrice || 199) - activePlan.monthlyPrice;
      estimatedSavingsOrCost = diff;
      reason = 'Your learning velocity is high. Silver will unlock 1080p Full HD ad-free streaming and 5 downloads/day.';
      urgency = 'high';
      rationale = [
        `Hit or approached the 3 downloads/day limit on peak days (peak: ${maxDownloadsInSingleDay})`,
        'Ad-free experience provides uninterrupted research',
        'Cost difference is only ₹100/month for 5 downloads/day',
      ];
    } else if (totalRecentDownloads <= 3 && activeDaysCount <= 2) {
      recommendedPlanSlug = 'free';
      estimatedSavingsOrCost = -activePlan.monthlyPrice;
      reason = `You have only used ${totalRecentDownloads} downloads this month (${monthlyUtilizationPct}% of quota). Downgrading to Free would save ₹${activePlan.monthlyPrice}/month.`;
      urgency = 'normal';
      rationale = [
        `Only ${activeDaysCount} active days in the last month`,
        `Low utilization (${monthlyUtilizationPct}%) of paid Bronze features`,
        `Annual potential savings: ₹${activePlan.monthlyPrice * 12}`,
      ];
    } else {
      recommendedPlanSlug = 'bronze';
      reason = `Your Bronze membership is optimal for your usage rate (${monthlyUtilizationPct}% quota utilized across ${activeDaysCount} active days).`;
      rationale = [
        'Balanced utilization without hitting quota walls',
        'Cost-effective at ₹99/month',
        'No unnecessary premium overhead',
      ];
    }
  } else if (activePlan.slug === 'silver') {
    // Silver user evaluation
    if (totalRecentDownloads >= 75 || maxDownloadsInSingleDay >= 5) {
      recommendedPlanSlug = 'gold';
      const diff = (allPlans.find((p) => p.slug === 'gold')?.monthlyPrice || 299) - activePlan.monthlyPrice;
      estimatedSavingsOrCost = diff;
      reason = 'You are an advanced power user. Gold provides 10 downloads/day, 4K Ultra HD streaming, and priority support.';
      urgency = 'high';
      rationale = [
        `Peak daily downloads reached ${maxDownloadsInSingleDay}`,
        '4K streaming and maximum quota eliminate all caps',
        'VIP concierge and full course access included',
      ];
    } else if (totalRecentDownloads <= 10 && activeDaysCount <= 4) {
      recommendedPlanSlug = 'bronze';
      const diff = activePlan.monthlyPrice - (allPlans.find((p) => p.slug === 'bronze')?.monthlyPrice || 99);
      estimatedSavingsOrCost = -diff;
      reason = `You used only ${totalRecentDownloads} downloads this month (${monthlyUtilizationPct}% utilization). Stepping down to Bronze would save ₹${diff}/month.`;
      urgency = 'normal';
      rationale = [
        `Low utilization (${monthlyUtilizationPct}%) of Silver features`,
        `Bronze covers your current download rate of ${totalRecentDownloads} items/mo`,
        `Annual potential savings: ₹${diff * 12}`,
      ];
    } else {
      recommendedPlanSlug = 'silver';
      reason = `Silver is your sweet spot! You are utilizing ${monthlyUtilizationPct}% of your capacity with 1080p Full HD ad-free playback.`;
      rationale = [
        `Consistent activity across ${activeDaysCount} days`,
        'Optimal price-to-value ratio at ₹199/month',
        'Ad-free access actively utilized',
      ];
    }
  } else if (activePlan.slug === 'gold') {
    // Gold user evaluation
    if (totalRecentDownloads <= 15 && activeDaysCount <= 5) {
      recommendedPlanSlug = 'silver';
      const diff = activePlan.monthlyPrice - (allPlans.find((p) => p.slug === 'silver')?.monthlyPrice || 199);
      estimatedSavingsOrCost = -diff;
      reason = `You used ${totalRecentDownloads} downloads out of 300 available (${monthlyUtilizationPct}% quota). Downgrading to Silver saves ₹${diff}/month with minimal impact.`;
      urgency = 'normal';
      rationale = [
        `Ultra-low quota utilization (${monthlyUtilizationPct}%) on Gold tier`,
        'Silver still includes 1080p Full HD and ad-free experience',
        `Save ₹${diff * 12}/year with zero compromise to essential workflow`,
      ];
    } else {
      recommendedPlanSlug = 'gold';
      reason = 'You are maximizing the Gold tier benefits with high download volumes and premium streaming entitlements.';
      rationale = [
        'Highest tier capabilities fully active',
        'VIP priority access and 4K Ultra HD in use',
        'Maximum quota ceiling guarantees uninterrupted workflow',
      ];
    }
  }

  const recPlan = allPlans.find((p) => p.slug === recommendedPlanSlug) || activePlan;

  return {
    currentPlan: {
      name: activePlan.name,
      slug: activePlan.slug,
      monthlyPrice: activePlan.monthlyPrice,
      dailyLimit,
      monthlyLimit,
    },
    recommendedPlan: {
      name: recPlan.name,
      slug: recPlan.slug,
      monthlyPrice: recPlan.monthlyPrice,
      dailyLimit: recPlan.quotas?.dailyDownloads || 1,
      monthlyLimit: recPlan.quotas?.monthlyDownloads || 30,
    },
    isCurrentOptimal: activePlan.slug === recommendedPlanSlug,
    actionType:
      activePlan.slug === recommendedPlanSlug
        ? 'retain'
        : recPlan.tierLevel > activePlan.tierLevel
        ? 'upgrade'
        : 'downgrade',
    costDifference: recPlan.monthlyPrice - activePlan.monthlyPrice,
    urgency,
    headline: reason,
    rationale,
    metrics: {
      recentDownloadsCount: totalRecentDownloads,
      activeDaysPastMonth: activeDaysCount,
      monthlyUtilizationPct,
      maxDownloadsInSingleDay,
    },
  };
};

export const detectSubscriptionWaste = ({
  subscription,
  downloadHistory = [],
  payments = [],
  allPlans = [],
}) => {
  const activePlan = subscription?.plan || allPlans.find((p) => p.slug === 'free') || {
    name: 'Free',
    slug: 'free',
    monthlyPrice: 0,
    quotas: { monthlyDownloads: 30, dailyDownloads: 1 },
  };

  const monthlyQuota = activePlan.quotas?.monthlyDownloads || 30;
  const monthlyPrice = activePlan.monthlyPrice || 0;

  // Recent 30 days downloads
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthDownloads = downloadHistory.filter((d) => new Date(d.downloadedAt) >= thirtyDaysAgo);
  const usedDownloads = monthDownloads.length;
  const unusedDownloads = Math.max(0, monthlyQuota - usedDownloads);

  const usagePercent = Math.min(100, Math.round((usedDownloads / monthlyQuota) * 100));
  const wastePercent = Math.max(0, 100 - usagePercent);

  // Inactive period check
  const latestDownload = downloadHistory.length > 0
    ? new Date(Math.max(...downloadHistory.map((d) => new Date(d.downloadedAt).getTime())))
    : null;
  const daysSinceLastActivity = latestDownload
    ? Math.floor((now - latestDownload) / (1000 * 60 * 60 * 24))
    : 30;

  const isInactiveWarning = monthlyPrice > 0 && daysSinceLastActivity >= 14;

  // Monetary waste estimation
  const estimatedMonetaryWasteMonthly = monthlyPrice > 0 ? Math.round(monthlyPrice * (wastePercent / 100)) : 0;
  const estimatedMonetaryWasteYearly = estimatedMonetaryWasteMonthly * 12;

  // Total lifetime spend
  const lifetimeSpent = payments
    .filter((p) => p.status === 'Successful' || p.status === 'Success')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return {
    activePlanName: activePlan.name,
    monthlyPrice,
    lifetimeSpent,
    monthlyQuota,
    usedDownloads,
    unusedDownloads,
    usagePercent,
    wastePercent,
    daysSinceLastActivity,
    isInactiveWarning,
    estimatedMonetaryWasteMonthly,
    estimatedMonetaryWasteYearly,
    recommendationMessage:
      wastePercent > 60 && monthlyPrice > 0
        ? `You have ${unusedDownloads} unused downloads this month (${wastePercent}% unused capacity). Reviewing lower tiers could save up to ₹${estimatedMonetaryWasteYearly}/year.`
        : wastePercent === 0
        ? 'Maximum efficiency: You have utilized 100% of your current subscription quota!'
        : `Your subscription efficiency is solid at ${usagePercent}% utilization with ${unusedDownloads} buffer downloads remaining.`,
  };
};

export const simulateSubscriptionCost = ({
  targetPlanSlug = 'silver',
  durationMonths = 6,
  allPlans = [],
  currentPlanSlug = 'free',
}) => {
  const plan = allPlans.find((p) => p.slug === targetPlanSlug) || allPlans.find((p) => p.slug === 'silver');
  const currentPlan = allPlans.find((p) => p.slug === currentPlanSlug) || allPlans.find((p) => p.slug === 'free');

  if (!plan) {
    throw new Error('Target plan not found for simulation.');
  }

  const monthlyPrice = plan.monthlyPrice || 0;
  let totalCost = 0;
  let savingsVsStandardMonthly = 0;

  // Apply standard discounts for multi-month commitments
  if (durationMonths === 3) {
    // 5% incentive
    const standardCost = monthlyPrice * 3;
    totalCost = plan.quarterlyPrice || Math.round(standardCost * 0.95);
    savingsVsStandardMonthly = standardCost - totalCost;
  } else if (durationMonths === 6) {
    // 10% incentive
    const standardCost = monthlyPrice * 6;
    totalCost = Math.round(standardCost * 0.9);
    savingsVsStandardMonthly = standardCost - totalCost;
  } else if (durationMonths === 12) {
    // 15% incentive / yearly price
    const standardCost = monthlyPrice * 12;
    totalCost = plan.yearlyPrice || Math.round(standardCost * 0.85);
    savingsVsStandardMonthly = standardCost - totalCost;
  } else {
    totalCost = monthlyPrice * durationMonths;
  }

  const currentPlanTotalCost = (currentPlan?.monthlyPrice || 0) * durationMonths;
  const netDifferenceVsCurrent = totalCost - currentPlanTotalCost;

  return {
    targetPlan: {
      name: plan.name,
      slug: plan.slug,
      tierLevel: plan.tierLevel,
      monthlyPrice: plan.monthlyPrice,
      quotas: plan.quotas,
      features: plan.features,
    },
    simulation: {
      durationMonths,
      totalEstimatedCost: totalCost,
      monthlyEquivalentCost: Math.round(totalCost / durationMonths),
      savingsVsStandardMonthly,
      currentPlanTotalCost,
      netDifferenceVsCurrent,
      isDowngradeSavings: netDifferenceVsCurrent < 0,
    },
  };
};

