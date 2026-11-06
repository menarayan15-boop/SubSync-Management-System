import React from 'react';

export const TierBadge = ({ tier }) => {
  const styles = {
    Free: 'bg-slate-100 text-slate-700 border-slate-300',
    Bronze: 'bg-orange-50 text-orange-800 border-orange-300',
    Silver: 'bg-slate-200 text-slate-900 border-slate-400 font-semibold',
    Gold: 'bg-amber-100 text-amber-900 border-amber-400 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${
        styles[tier] || styles.Free
      }`}
    >
      {tier}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    Successful: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    Pending: 'bg-amber-50 text-amber-700 border-amber-300',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-300',
    Open: 'bg-sky-50 text-sky-700 border-sky-300',
    Expired: 'bg-rose-50 text-rose-700 border-rose-300',
    Cancelled: 'bg-slate-100 text-slate-700 border-slate-300',
    Failed: 'bg-rose-50 text-rose-700 border-rose-300',
    Refunded: 'bg-purple-50 text-purple-700 border-purple-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || 'bg-slate-100 text-slate-700 border-slate-300'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'Active' || status === 'Successful' || status === 'Paid'
            ? 'bg-emerald-500'
            : status === 'Failed' || status === 'Expired'
            ? 'bg-rose-500'
            : 'bg-amber-500'
        }`}
      />
      {status}
    </span>
  );
};
