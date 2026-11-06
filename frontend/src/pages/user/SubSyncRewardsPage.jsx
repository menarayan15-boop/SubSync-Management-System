import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Award,
  Sparkles,
  Gift,
  Share2,
  Copy,
  Check,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowRight,
  Download,
  Tag,
  Crown,
  FileCheck,
  RefreshCw,
  Coins,
  Users,
} from 'lucide-react';

const LEVEL_COLORS = {
  Starter: 'bg-slate-100 text-slate-700 border-slate-200',
  Explorer: 'bg-blue-100 text-blue-700 border-blue-200',
  Achiever: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Pro Member': 'bg-purple-100 text-purple-700 border-purple-200',
  'Elite Member': 'bg-amber-100 text-amber-800 border-amber-300',
};

const SubSyncRewardsPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/rewards/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load rewards dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleRedeem = async (item) => {
    if (!window.confirm(`Redeem "${item.title}" for ${item.pointCost} points?`)) {
      return;
    }

    try {
      setRedeeming(item._id);
      const res = await api.post('/api/rewards/redeem', { itemId: item._id });
      if (res.data?.success) {
        alert(res.data.message);
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to redeem reward.');
    } finally {
      setRedeeming(null);
    }
  };

  const getItemIcon = (iconName) => {
    switch (iconName) {
      case 'download':
        return <Download className="w-5 h-5 text-violet-600" />;
      case 'tag':
        return <Tag className="w-5 h-5 text-emerald-600" />;
      case 'crown':
        return <Crown className="w-5 h-5 text-amber-600" />;
      default:
        return <FileCheck className="w-5 h-5 text-purple-600" />;
    }
  };

  const profile = dashboardData?.profile;

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Loyalty & Engagement Perks</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            SubSync Rewards Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Earn loyalty points by learning, completing research resources, and inviting colleagues. Redeem your balance for extra download allowances, exclusive coupon passes, and membership upgrades.
          </p>
        </div>

        {/* Balance & Level Hero Card */}
        <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Balance Column (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <span className="text-xs uppercase font-bold text-violet-300 tracking-wider">Available Balance</span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400 border border-white/10 shadow-inner">
                  <Coins className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-4xl font-black tracking-tight">
                    {loading ? '...' : profile?.availablePoints || 0}
                  </span>
                  <span className="text-xs text-violet-200 block font-medium">SubSync Points</span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 text-xs text-violet-200">
                <span><strong>Lifetime Earned:</strong> {profile?.lifetimeEarned || 0} pts</span>
                <span>•</span>
                <span><strong>Points Spent:</strong> {profile?.pointsSpent || 0} pts</span>
              </div>
            </div>

            {/* Level & Progress Column (7 cols) */}
            <div className="md:col-span-7 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-violet-300 tracking-wider">Tier Status</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-bold">{profile?.currentLevel || 'Starter'}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">Active Tier</span>
                  </div>
                </div>

                {profile?.nextLevel && (
                  <span className="text-xs text-violet-200 font-medium text-right">
                    Next Tier: <strong className="text-white">{profile.nextLevel}</strong> ({profile.pointsToNextLevel} pts away)
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-300 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${profile?.progressPercent || 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-violet-300">
                  <span>Progress to {profile?.nextLevel || 'Max Level'}</span>
                  <span>{profile?.progressPercent || 100}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className="p-6 lg:p-8 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 mb-1">
                <Share2 className="w-3.5 h-3.5" />
                <span>Earn 100 Points per Friend</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Invite Friends & Earn Free Upgrades</h2>
              <p className="text-xs text-slate-500">
                Share your personal link. When a friend creates an account, 100 bonus points are automatically credited to your balance.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-2xl bg-violet-50/60 border border-violet-100">
              <Users className="w-5 h-5 text-violet-600" />
              <div className="text-right">
                <span className="text-base font-extrabold text-slate-900 block leading-tight">
                  {profile?.referralCount || 0}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Invited Friends</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate">
              <span className="truncate">{profile?.referralLink || 'Loading link...'}</span>
            </div>
            <button
              onClick={() => handleCopy(profile?.referralLink || '', 'link')}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm shadow-violet-200"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
            </button>
          </div>
        </div>

        {/* Rewards Catalogue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Rewards Catalogue</h2>
              <p className="text-xs text-slate-500">Redeem your accumulated points for genuine platform perks and quota boosts.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
              <span>Loading catalogue...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData?.catalogue?.map((item) => {
                const canAfford = (profile?.availablePoints || 0) >= item.pointCost;

                return (
                  <div
                    key={item._id}
                    className="p-5 rounded-3xl bg-white border border-violet-100 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                        {getItemIcon(item.icon)}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="text-xl font-extrabold text-violet-700">{item.pointCost}</span>
                        <span className="text-xs text-slate-400">points</span>
                      </div>
                    </div>

                    <button
                      disabled={!canAfford || redeeming === item._id}
                      onClick={() => handleRedeem(item)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-sm shadow-violet-200'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {redeeming === item._id
                        ? 'Redeeming...'
                        : canAfford
                        ? 'Redeem Perk'
                        : `Need ${item.pointCost - (profile?.availablePoints || 0)} more pts`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Redemptions & Generated Codes */}
        {dashboardData?.redemptions && dashboardData.redemptions.length > 0 && (
          <div className="p-6 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-4 h-4 text-violet-600" />
              <span>Your Active Redemptions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboardData.redemptions.map((red) => (
                <div key={red._id} className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                  <span className="text-xs font-bold text-purple-900 block truncate">
                    {red.catalogueItem?.title || 'Platform Perk'}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-violet-700 bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                      {red.redemptionCode}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(red.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reward Transaction Ledger Table */}
        <div className="p-6 lg:p-8 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Reward Transaction History</h3>
              <p className="text-xs text-slate-400">Official cryptographic points ledger recorded in MongoDB</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {!dashboardData?.recentTransactions || dashboardData.recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No transaction records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-y border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Transaction Ref</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4">Balance After</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dashboardData.recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-slate-700 text-[11px]">
                        {tx.reference}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{tx.description}</p>
                        <p className="text-slate-400 text-[10px]">{tx.action}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            tx.type === 'earn'
                              ? 'text-emerald-600'
                              : tx.type === 'spend'
                              ? 'text-rose-600'
                              : 'text-violet-600'
                          }`}
                        >
                          {tx.type === 'earn' ? `+${tx.points}` : `-${tx.points}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {tx.balanceAfter} pts
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubSyncRewardsPage;

