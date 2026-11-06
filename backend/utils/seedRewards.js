import RewardCatalogueItem from '../models/RewardCatalogueItem.js';

export const INITIAL_REWARD_ITEMS = [
  {
    title: '+5 Download Quota Allowance',
    description: 'Instant +5 download allowance added to your daily quota for digital resource vault publications.',
    pointCost: 100,
    category: 'downloads',
    icon: 'download',
    benefitPayload: { quotaBonus: 5 },
    isActive: true,
  },
  {
    title: 'Research Vault Single Publication Pass',
    description: 'Unlock 1 premium gated publication in the Research Vault regardless of your subscription tier.',
    pointCost: 250,
    category: 'premium_pass',
    icon: 'file-check',
    benefitPayload: { unlockCount: 1 },
    isActive: true,
  },
  {
    title: '20% Platform Upgrade Coupon',
    description: 'Receive a promo code granting 20% discount on any Bronze, Silver, or Gold plan upgrade.',
    pointCost: 400,
    category: 'discount_coupon',
    icon: 'tag',
    benefitPayload: { discountPercent: 20, couponCode: 'LOYALTY20' },
    isActive: true,
  },
  {
    title: '1-Month Bronze Subscription Pass',
    description: 'One full month of Bronze tier membership including 90 monthly downloads and priority vault access.',
    pointCost: 600,
    category: 'upgrade',
    icon: 'crown',
    benefitPayload: { planSlug: 'bronze', durationMonths: 1 },
    isActive: true,
  },
];

export const seedRewardCatalogue = async () => {
  const count = await RewardCatalogueItem.countDocuments();
  if (count === 0) {
    console.log('[Seeder] Populating initial Reward Catalogue items...');
    await RewardCatalogueItem.insertMany(INITIAL_REWARD_ITEMS);
    console.log(`[Seeder] Seeded ${INITIAL_REWARD_ITEMS.length} reward catalogue items.`);
  }
};

